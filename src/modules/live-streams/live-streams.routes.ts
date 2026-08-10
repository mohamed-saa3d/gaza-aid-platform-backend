import { Router } from 'express';
import { requireAdmin } from '../../shared/authorization';
import { validateRequest } from '../../shared/middlewares/validate.middleware';
import {
  createLiveStream,
  deleteLiveStream,
  getLiveStream,
  getLiveStreams,
  updateLiveStream,
} from './live-streams.controller';
import {
  createLiveStreamSchema,
  updateLiveStreamSchema,
} from './live-streams.validation';

export const liveStreamsRoutes = Router();

liveStreamsRoutes.get('/', getLiveStreams);
liveStreamsRoutes.get('/:id', getLiveStream);
liveStreamsRoutes.post('/', requireAdmin, validateRequest(createLiveStreamSchema), createLiveStream);
liveStreamsRoutes.put('/:id', requireAdmin, validateRequest(updateLiveStreamSchema), updateLiveStream);
liveStreamsRoutes.delete('/:id', requireAdmin, deleteLiveStream);
