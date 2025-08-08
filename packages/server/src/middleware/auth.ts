import { PrismaClient } from '@prisma/client';
import type { Request, Response, NextFunction } from 'express';

const prisma = new PrismaClient();

// Module augmentation for Express Request
declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Express {
		interface Request {
			sessionUser?: {
				id: string;
				email: string;
				role: string;
				tenantId: string;
				banned: boolean;
			};
		}
	}
}

function parseCookies(header?: string) {
	const list: Record<string, string> = {};
	if (!header) return list;
	header.split(/; */).forEach(cookie => {
		const eq = cookie.indexOf('=');
		if (eq < 0) return;
		const key = decodeURIComponent(cookie.substring(0, eq).trim());
		const val = decodeURIComponent(cookie.substring(eq + 1).trim());
		list[key] = val;
	});
	return list;
}

export async function loadSession(req: Request, res: Response, next: NextFunction) {
	try {
		const cookies = parseCookies(req.headers.cookie as string | undefined);
		const token = cookies.session;
		if (!token) return next();
		const session = await prisma.session.findUnique({ where: { token }, include: { user: true } });
		if (!session) return next();
		if (session.expiresAt < new Date()) {
			await prisma.session.delete({ where: { token } });
			return next();
		}
		req.sessionUser = {
			id: session.user.id,
			email: session.user.email,
			role: session.user.role,
			tenantId: session.user.tenantId,
			banned: session.user.banned,
		};
		next();
	} catch (e) {
		console.error('[auth middleware] loadSession error', e);
		next();
	}
}

export function requireSession(req: Request, res: Response, next: NextFunction) {
	if (!req.sessionUser) {
		return res.status(401).json({ error: 'Authentication required' });
	}
	if (req.sessionUser.banned) {
		return res.status(403).json({ error: 'Account is banned' });
	}
	next();
}

export function requireRoles(...roles: string[]) {
	return (req: Request, res: Response, next: NextFunction) => {
		if (!req.sessionUser) return res.status(401).json({ error: 'Authentication required' });
		if (req.sessionUser.banned) return res.status(403).json({ error: 'Account is banned' });
		if (roles.length && !roles.includes(req.sessionUser.role)) {
			return res.status(403).json({ error: 'Forbidden' });
		}
		next();
	};
}

export function requireTenantMatch(tenantIdParam: string) {
	return (req: Request, res: Response, next: NextFunction) => {
		if (!req.sessionUser) return res.status(401).json({ error: 'Authentication required' });
		const param = (req.params as any)[tenantIdParam];
		if (param && param !== req.sessionUser.tenantId) {
			return res.status(403).json({ error: 'Tenant mismatch' });
		}
		next();
	};
}

export default { loadSession, requireSession, requireRoles, requireTenantMatch };
