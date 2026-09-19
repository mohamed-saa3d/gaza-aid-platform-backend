import type { RequestHandler } from 'express';
import { AdminRole } from '@prisma/client';
import { adminService } from './admin.service';
import { AppError } from '../../shared/errors/app-error';
import { isMongoObjectId } from '../../shared/utils/object-id';

const getSingleParam = (param: string | string[] | undefined): string | undefined => {
  return Array.isArray(param) ? param[0] : param;
};

export const adminLogin: RequestHandler = async (req, res, next) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const { accessToken, refreshToken, admin } = await adminService.login({ email, password });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      path: '/',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Admin logged in successfully',
      data: { accessToken, admin },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminProfile: RequestHandler = async (req, res, next) => {
  try {
    const admin = await adminService.getProfile(req.user!.id);

    res.status(200).json({
      success: true,
      message: 'Admin profile fetched successfully',
      data: admin,
    });
  } catch (error) {
    next(error);
  }
};

export const createAdmin: RequestHandler = async (req, res, next) => {
  try {
    const { name, email, password, role, rootEmail, rootPassword } = req.body as {
      name: string;
      email: string;
      password: string;
      role?: AdminRole;
      rootEmail: string;
      rootPassword: string;
    };

    if (!req.user?.id || !req.user?.email) {
      throw new AppError('Authentication token is required', 401);
    }

    if (req.user.email.toLowerCase().trim() !== rootEmail.toLowerCase().trim()) {
      throw new AppError('Invalid Root Admin credentials confirmation', 401);
    }

    await adminService.verifyRootAdminPassword(req.user.id, rootPassword);

    if (role && !Object.values(AdminRole).includes(role)) {
      throw new AppError('Invalid admin role', 400);
    }

    const admin = await adminService.createAdmin({ name, email, password, role });

    res.status(201).json({
      success: true,
      data: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllAdmins: RequestHandler = async (_req, res, next) => {
  try {
    const admins = await adminService.getAllAdmins();

    res.status(200).json({
      success: true,
      message: 'Admins fetched successfully',
      data: admins,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdmin: RequestHandler = async (req, res, next) => {
  try {
    const id = getSingleParam(req.params.id);
    const { name, role } = req.body as {
      name?: string;
      role?: AdminRole;
    };

    if (!id) {
      throw new AppError('Admin ID is required', 400);
    }

    if (!isMongoObjectId(id)) {
      throw new AppError('Invalid admin ID', 400);
    }

    const admin = await adminService.updateAdmin({
      id,
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      name,
      role,
    });

    res.status(200).json({
      success: true,
      message: 'Admin updated successfully',
      data: admin,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAdmin: RequestHandler = async (req, res, next) => {
  try {
    const id = getSingleParam(req.params.id);

    if (!id) {
      throw new AppError('Admin ID is required', 400);
    }

    if (!isMongoObjectId(id)) {
      throw new AppError('Invalid admin ID', 400);
    }

    await adminService.deleteAdmin(id, req.user!.id, req.user!.email);

    res.status(200).json({
      success: true,
      message: 'Admin deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
