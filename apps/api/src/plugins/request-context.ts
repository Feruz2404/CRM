import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import { randomUUID } from 'node:crypto';

declare module 'fastify' {
	interface FastifyRequest {
		requestId: string;
		orgId: string | null;
		userId: string | null;
	}
}

export function buildRequestContextPlugin() {
	const plugin: FastifyPluginAsync = async (app) => {
		app.addHook('onRequest', async (req) => {
			req.requestId = (req.headers['x-request-id'] as string | undefined) ?? randomUUID();
			req.orgId = null;
			req.userId = null;
		});

		app.addHook('onSend', async (_req, reply, payload) => {
			reply.header('x-request-id', _req.requestId);
			return payload;
		});
	};

	return fp(plugin, { name: 'request-context' });
}
