import { Job, Worker } from 'bullmq';
import { smtpConfigured, transport } from '../shared/services/email/email.transporter';
import { prisma } from '../shared/database/prisma';
import { bullmqConnection } from '../queues/redis.connection';
import type { EmailJobData } from '../queues/email.queue';
import type { BroadcastJobData } from '../queues/broadcast.queue';

const emailWorker = new Worker<EmailJobData>(
  'email',
  async (job: Job<EmailJobData>) => {
    if (!smtpConfigured || !transport) {
      console.log(
        `[Mock Email] Sent to ${job.data.to} (Subject: ${job.data.subject}) - Content hidden for security.`,
      );
      return;
    }

    await transport.sendMail(job.data);
  },
  { connection: bullmqConnection, concurrency: 10 },
);

const broadcastWorker = new Worker<BroadcastJobData>(
  'broadcast',
  async (job: Job<BroadcastJobData>) => {
    const subscribers = await prisma.subscriber.findMany({
      where: { isActive: true },
      select: { email: true },
    });

    for (const subscriber of subscribers) {
      console.log(
        `[Mock Broadcast] Queued message for ${subscriber.email} (Subject: ${job.data.subject}) - Content hidden for security.`,
      );
    }
  },
  { connection: bullmqConnection, concurrency: 1 },
);

for (const worker of [emailWorker, broadcastWorker]) {
  worker.on('failed', (job, error) => {
    console.error(`Queue job failed: ${job?.name ?? 'unknown'}`, error);
  });
}

const shutdown = async () => {
  await Promise.all([emailWorker.close(), broadcastWorker.close()]);
  await prisma.$disconnect();
};

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);