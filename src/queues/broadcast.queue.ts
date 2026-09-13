import { Queue } from 'bullmq';
import { bullmqConnection } from './redis.connection';

export type BroadcastJobData = {
  subject: string;
  message: string;
};

export const broadcastQueue = new Queue<BroadcastJobData>('broadcast', {
  connection: bullmqConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
});