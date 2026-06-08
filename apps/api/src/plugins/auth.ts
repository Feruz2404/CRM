import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

export type AuthEnv = {
	JWT_ISSUER: string;
	JWT_AUDIENCE: string;
	JWT_PUBLIC_KEY_PEM: string;
	JWT_PRIVATE_KEY_PEM: string;
};

const jwtPayloadSchema = z.object({
	sub: z.string().min(1),
	org: z.string().min(1),
	branches: z.array(z.string().min(1)).default([]),
	role: z.string().min(1),
	permissions: z.array(z.string().min(1)).default([]),
	iat: z.number(),
	exp: z.number(),
});

export function buildAuthPlugin(env: AuthEnv) {
	const plugin: FastifyPluginAsync = async (app) => {
		app.decorate('verifyJwt', async (token: string) => {
			const decoded = jwt.verify(token, env.JWT_PUBLIC_KEY_PEM, {
				algorithms: ['RS256'],
				issuer: env.JWT_ISSUER,
				audience: env.JWT_AUDIENCE,
			});
			return jwtPayloadSchema.parse(decoded);
		});

		app.addHook('preHandler', async (req) => {
			const auth = req.headers.authorization;
			if (!auth) return;
			const [kind, token] = auth.split(' ');
			if (kind !== 'Bearer' || !token) return;
			const payload = await (app as any).verifyJwt(token);
			req.userId = payload.sub;
			req.orgId = payload.org;
		});
	};

	return fp(plugin, { name: 'auth' });
}
