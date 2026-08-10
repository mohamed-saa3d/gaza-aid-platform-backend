import type { RequestHandler } from 'express';
import { AppError } from '../../shared/errors/app-error';
import { requireAdmin } from '../../shared/authorization';
import { donationsService } from './donations.service';
import { isMongoObjectId } from '../../shared/utils/object-id';
import type { ParsedQs } from 'qs';

const toNumber = (value: string | string[] | ParsedQs | ParsedQs[] | (string | ParsedQs)[] | undefined, fallback: number): number => {
  const parsed = Array.isArray(value) ? Number(value[0]) : Number(value);
  return Number.isNaN(parsed) || parsed <= 0 ? fallback : parsed;
};

export const initializeDonation: RequestHandler = async (req, res, next) => {
  try {
    const { amount, currency, projectId, userId } = req.body as {
      amount: number;
      currency: string;
      projectId: string;
      userId?: string;
    };

    const result = await donationsService.initializeDonation({ amount, currency, projectId, userId });

    res.status(201).json({
      success: true,
      message: 'Donation initialized successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const handlePaymentWebhook: RequestHandler = async (req, res, next) => {
  try {
    const { donationId, transactionId } = req.body as { donationId: string; transactionId: string };

    const donation = await donationsService.handlePaymentWebhook({ donationId, transactionId });

    res.status(200).json({
      success: true,
      message: 'Payment webhook processed successfully',
      data: donation,
    });
  } catch (error) {
    next(error);
  }
};

export const getDonations: RequestHandler = async (req, res, next) => {
  try {
    const page = toNumber(req.query.page, 1);
    const limit = toNumber(req.query.limit, 10);

    const result = await donationsService.getAllDonations(page, limit);

    res.status(200).json({
      success: true,
      message: 'Donations fetched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectDonations: RequestHandler = async (req, res, next) => {
  try {
    const projectId = String(req.params.projectId);

    if (!isMongoObjectId(projectId)) {
      throw new AppError('Invalid project ID', 400);
    }

    const donations = await donationsService.getProjectDonations(projectId);

    res.status(200).json({
      success: true,
      message: 'Project donations fetched successfully',
      data: donations,
    });
  } catch (error) {
    next(error);
  }
};

