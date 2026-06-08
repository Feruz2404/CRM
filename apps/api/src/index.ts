import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { z } from 'zod';

import { buildAuthPlugin } from './plugins/auth.js';
import { buildRequestContextPlugin } from './plugins/request-context.js';
import { buildHealthRoutes } from './routes/health.js';

const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
	PORT: z.coerce.number().int().min(1).max(65535).default(3000),
	JWT_ISSUER: z.string().min(1).default('platform'),
	JWT_AUDIENCE: z.string().min(1).default('platform'),
	JWT_PUBLIC_KEY_PEM: z.string().min(1),
	JWT_PRIVATE_KEY_PEM: z.string().min(1),
});

const env = envSchema.parse(process.env);

export async function buildApp() {
	const app = Fastify({ logger: true });

	await app.register(helmet, {
		contentSecurityPolicy: env.NODE_ENV === 'production',
	});

	await app.register(rateLimit, {
		max: 200,
		timeWindow: '1 minute',
	});

	await app.register(swagger, {
		openapi: {
			info: { title: 'Enterprise Platform API', version: '0.1.0' },
		},
	});
	await app.register(swaggerUi, { routePrefix: '/docs' });

	await app.register(buildRequestContextPlugin());
	await app.register(buildAuthPlugin(env));
	await app.register(buildHealthRoutes());

	return app;
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const app = await buildApp();
	await app.listen({ port: env.PORT, host: '0.0.0.0' });
}
