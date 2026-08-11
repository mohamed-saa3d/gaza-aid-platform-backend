import type { Request, RequestHandler } from 'express';
import { AppError } from '../../shared/errors/app-error';
import { usersService } from './users.service';
import type { ChangePasswordInput, UpdateProfileInput } from './users.types';

const getAuthenticatedUserId = (req: Request): string => {
  if (!req.user?.id) {
    throw new AppError('Authentication is required', 401);
  }

  return req.user.id;
};

export const getProfile: RequestHandler = async (req, res, next) => {
  try {
    const user = await usersService.getProfile(getAuthenticatedUserId(req));

    res.status(200).json({
      success: true,
      message: 'User profile fetched successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile: RequestHandler = async (req, res, next) => {
  try {
    const payload = req.body as Omit<UpdateProfileInput, 'userId'>;
    
    const user = await usersService.updateProfile({
      ...payload, // 2. نفرد الداتا اللي جاية من الـ body الأول
      userId: getAuthenticatedUserId(req), // 3. نجبره يستخدم الـ ID بتاع التوكن في الآخر (عشان لو فيه أي تلاعب يتمسح)
    });

    res.status(200).json({
      success: true,
      message: 'User profile updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword: RequestHandler = async (req, res, next) => {
  try {
    const payload = req.body as Omit<ChangePasswordInput, 'userId'>;
    const user = await usersService.changePassword({
      userId: getAuthenticatedUserId(req),
      ...payload,
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const softDeleteAccount: RequestHandler = async (req, res, next) => {
  try {
    const user = await usersService.softDeleteAccount(getAuthenticatedUserId(req));

    res.status(200).json({
      success: true,
      message: 'User account soft deleted successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers: RequestHandler = async (req, res, next) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);

    const users = await usersService.getAllUsers(page, limit);

    res.status(200).json({
      success: true,
      message: 'Active users fetched successfully',
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserDonations: RequestHandler = async (req, res, next) => {
  try {
    const donations = await usersService.getUserDonations(getAuthenticatedUserId(req));

    res.status(200).json({
      success: true,
      message: 'User donations fetched successfully',
      data: donations,
    });
  } catch (error) {
    next(error);
  }
};
