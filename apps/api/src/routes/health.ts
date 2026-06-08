import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '@platform/db';

export function buildHealthRoutes() {
	const plugin: FastifyPluginAsync = async (app) => {
		app.get('/api/v1/health', async () => {
			let db = 'down';
			try {
				await prisma.$queryRaw`SELECT 1`;
				db = 'up';
			} catch {
				db = 'down';
			}

			return {
				status: 'ok',
				db,
				redis: 'unknown',
				ofd: 'unknown',
				version: '0.1.0',
				uptime: process.uptime(),
			};
		});
	};

	return fp(plugin, { name: 'health-routes' });
}
