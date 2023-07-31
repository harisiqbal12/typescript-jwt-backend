import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minutes
	max: 10, // max ten hits
	standardHeaders: true,
	legacyHeaders: false,
});

export default limiter;
