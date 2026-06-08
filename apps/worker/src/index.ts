import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { z } from 'zod';
import { prisma } from '@platform/db';

const envSchema = z.object({
	REDIS_URL: z.string().min(1),
});

const env = envSchema.parse(process.env);

const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

/**
 * Outbox publisher worker.
 *
 * - Reads pending events from Postgres outbox table.
 * - Publishes to Redis Streams using eventName as stream key.
 * - Marks processedAt on success; increments attempts + sets failedAt/lastError on failures.
 *
 * This is the minimal production baseline; per-module consumers will be added as modules are implemented.
 */
export const outboxWorker = new Worker(
	'outbox',
	async () => {
		const pending = await prisma.outboxEvent.findMany({
			where: { processedAt: null, failedAt: null },
			orderBy: { createdAt: 'asc' },
			take: 100,
		});

		for (const evt of pending) {
			try {
				await connection.xadd(
					evt.eventName,
					'*',
					'organisationId',
					evt.organisationId,
					'payload',
					JSON.stringify(evt.payload),
				);

				await prisma.outboxEvent.update({
					where: { id: evt.id },
					data: { processedAt: new Date() },
				});
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				await prisma.outboxEvent.update({
					where: { id: evt.id },
					data: {
						attempts: { increment: 1 },
						failedAt: new Date(),
						lastError: msg,
					},
				});
				throw err;
			}
		}

		return { processed: pending.length };
	},
	{ connection, concurrency: 1 },
);

outboxWorker.on('failed', (_job, err) => {
	console.error('outbox job failed', { err });
});
