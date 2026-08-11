import type { RequestHandler } from 'express';
import { parseLimit, parsePage } from '../../shared/utils/pagination';
import { subscribersService } from './subscribers.service';

export const subscribe: RequestHandler = async (req, res, next) => {
  try {
    const subscriber = await subscribersService.subscribe(req.body);

    res.status(201).json({
      success: true,
      message: 'Subscribed successfully',
      data: subscriber,
    });
  } catch (error) {
    next(error);
  }
};

export const getSubscribersCount: RequestHandler = async (_req, res, next) => {
  try {
    const count = await subscribersService.getSubscribersCount();

    res.status(200).json({
      success: true,
      message: 'Subscribers count fetched successfully',
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllSubscribers: RequestHandler = async (req, res, next) => {
  try {
    const data = await subscribersService.getAllSubscribers({
      page: parsePage(req.query.page),
      limit: parseLimit(req.query.limit),
    });

    res.status(200).json({
      success: true,
      message: 'Subscribers fetched successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const broadcastMessage: RequestHandler = async (req, res, next) => {
  try {
    const result = await subscribersService.broadcastMessage(req.body);

    res.status(200).json({
      success: true,
      message: 'Broadcast message queued successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
