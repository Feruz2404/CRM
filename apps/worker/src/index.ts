import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { z } from 'zod';

const envSchema = z.object({
	REDIS_URL: z.string().min(1),
});

const env = envSchema.parse(process.env);

const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

export const outboxQueue = new Queue('outbox', { connection });

export const outboxWorker = new Worker(
	'outbox',
	async (job) => {
		// Durable outbox publisher will be implemented against the DB outbox table.
		// Job processing must be idempotent; implementation follows TZ.
		return { processed: true, id: job.id };
	},
	{ connection },
);

outboxWorker.on('failed', (job, err) => {
	console.error('outbox job failed', { id: job?.id, err });
});
