import type { Request, RequestHandler } from 'express';
import { AppError } from '../../shared/errors/app-error';
import { usersService } from './users.service';

const getAuthenticatedUserId = (req: Request): string => {
  if (!req.user?.id) {
    throw new AppError('Authentication is required', 401);
  }

  return req.user.id;
};

export const register: RequestHandler = async (req, res, next) => {
  try {
    const user = await usersService.register(req.body);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const data = await usersService.login(req.body);

    res.status(200).json({
      success: true,
      message: 'User logged in successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
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
    const user = await usersService.updateProfile({
      userId: getAuthenticatedUserId(req),
      ...req.body,
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
