import type { ParsedQs } from 'qs';
import type { RequestHandler } from 'express';
import { AppError } from '../../shared/errors/app-error';
import { liveStreamsService } from './live-streams.service';
import { isMongoObjectId } from '../../shared/utils/object-id';
import { parseLimit, parsePage } from '../../shared/utils/pagination';

export const getLiveStreams: RequestHandler = async (req, res, next) => {
  try {
    const page = parsePage(req.query.page, 1);
    const limit = parseLimit(req.query.limit, 10);
    const result = await liveStreamsService.getLiveStreams(page, limit);

    res.status(200).json({
      success: true,
      message: 'Live streams fetched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getLiveStream: RequestHandler = async (req, res, next) => {
  try {
    const id = String(req.params.id);

    if (!isMongoObjectId(id)) {
      throw new AppError('Invalid live stream ID', 400);
    }

    const liveStream = await liveStreamsService.getLiveStreamById(id);

    res.status(200).json({
      success: true,
      message: 'Live stream fetched successfully',
      data: liveStream,
    });
  } catch (error) {
    next(error);
  }
};

export const createLiveStream: RequestHandler = async (req, res, next) => {
  try {
    const liveStream = await liveStreamsService.createLiveStream(req.body);

    res.status(201).json({
      success: true,
      message: 'Live stream created successfully',
      data: liveStream,
    });
  } catch (error) {
    next(error);
  }
};

export const updateLiveStream: RequestHandler = async (req, res, next) => {
  try {
    const id = String(req.params.id);

    if (!isMongoObjectId(id)) {
      throw new AppError('Invalid live stream ID', 400);
    }

    const liveStream = await liveStreamsService.updateLiveStream({ id, ...req.body });

    res.status(200).json({
      success: true,
      message: 'Live stream updated successfully',
      data: liveStream,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLiveStream: RequestHandler = async (req, res, next) => {
  try {
    const id = String(req.params.id);

    if (!isMongoObjectId(id)) {
      throw new AppError('Invalid live stream ID', 400);
    }

    await liveStreamsService.deleteLiveStream(id);

    res.status(200).json({
      success: true,
      message: 'Live stream deleted successfully',
      data: { id },
    });
  } catch (error) {
    next(error);
  }
};
