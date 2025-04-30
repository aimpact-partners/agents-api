import type { RateLimitRequestHandler } from 'express-rate-limit';
import type { IAuthenticatedRequest } from './user';
import rateLimitBase from 'express-rate-limit';

export /*bundle*/ const windows = {
	hourly: 60 * 60 * 1000,
	perMinute: 60 * 1000,
	daily: 24 * 60 * 60 * 1000,
};

export /*bundle*/ const rateLimit = (windowMs: number, max: number, user: boolean = true): RateLimitRequestHandler =>
	rateLimitBase({
		windowMs,
		max,
		standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
		legacyHeaders: false, // Disable the `X-RateLimit-*` headers
		keyGenerator: (req: IAuthenticatedRequest) => user && req.user.id,
	});
