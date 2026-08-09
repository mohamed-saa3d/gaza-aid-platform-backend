import type { RequestHandler } from 'express';
import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { AdminRole, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

const PASSWORD_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return secret;
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const signAdminToken = (admin: { id: string; email: string; role: AdminRole }): string => {
  const options: SignOptions = {
    subject: admin.id,
    expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as SignOptions['expiresIn'],
  };

  return jwt.sign(
    {
      email: admin.email,
      role: admin.role,
    },
    getJwtSecret(),
    options
  );
};

const getSingleParam = (param: string | string[] | undefined): string | undefined => {
  return Array.isArray(param) ? param[0] : param;
};

const isMongoObjectId = (value: string): boolean => /^[a-f\d]{24}$/i.test(value);

export const loginAdmin: RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
      return;
    }

    const admin = await prisma.admin.findUnique({
      where: { email: normalizeEmail(email) },
    });

    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    const token = signAdminToken(admin);

    res.status(200).json({
      success: true,
      message: 'Admin logged in successfully',
      data: {
        token,
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          createdAt: admin.createdAt,
          updatedAt: admin.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Creates a new admin account. The route using this handler should be protected.
 */
export const createAdmin: RequestHandler = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      role?: AdminRole;
    };

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
      return;
    }

    if (role && !Object.values(AdminRole).includes(role)) {
      res.status(400).json({
        success: false,
        message: 'Invalid admin role',
      });
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    const existingAdmin = await prisma.admin.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingAdmin) {
      res.status(409).json({
        success: false,
        message: 'An admin with this email already exists',
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

    const admin = await prisma.admin.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: role ?? AdminRole.EDITOR,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: admin,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      res.status(409).json({
        success: false,
        message: 'An admin with this email already exists',
      });
      return;
    }

    next(error);
  }
};

/**
 * Returns every admin without password hashes.
 */
export const getAllAdmins: RequestHandler = async (_req, res, next) => {
  try {
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      message: 'Admins fetched successfully',
      data: admins,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Updates editable admin fields: name and role.
 */
export const updateAdmin: RequestHandler = async (req, res, next) => {
  try {
    const id = getSingleParam(req.params.id);
    const { name, role } = req.body as {
      name?: string;
      role?: AdminRole;
    };

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Admin ID is required',
      });
      return;
    }

    if (!isMongoObjectId(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid admin ID',
      });
      return;
    }

    if (!name && !role) {
      res.status(400).json({
        success: false,
        message: 'At least one field is required to update the admin',
      });
      return;
    }

    if (role && !Object.values(AdminRole).includes(role)) {
      res.status(400).json({
        success: false,
        message: 'Invalid admin role',
      });
      return;
    }

    const admin = await prisma.admin.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(role ? { role } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Admin updated successfully',
      data: admin,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      res.status(404).json({
        success: false,
        message: 'Admin was not found',
      });
      return;
    }

    next(error);
  }
};

/**
 * Deletes an admin account by ID.
 */
export const deleteAdmin: RequestHandler = async (req, res, next) => {
  try {
    const id = getSingleParam(req.params.id);

    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Admin ID is required',
      });
      return;
    }

    if (!isMongoObjectId(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid admin ID',
      });
      return;
    }

    await prisma.admin.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Admin deleted successfully',
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      res.status(404).json({
        success: false,
        message: 'Admin was not found',
      });
      return;
    }

    next(error);
  }
};
