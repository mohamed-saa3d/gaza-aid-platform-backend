import { Queue } from 'bullmq';
import { bullmqConnection } from './redis.connection';

export type EmailJobData = {
  from?: string;
  to: string;
  subject: string;
  html: string;
};

export const emailQueue = new Queue<EmailJobData>('email', {
  connection: bullmqConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
});