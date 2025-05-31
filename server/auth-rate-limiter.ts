import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Rate limiter for login attempts
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  skipSuccessfulRequests: true, // Don't count successful requests
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    message: 'تعداد تلاش‌های ورود بیش از حد مجاز است. لطفاً ۱۵ دقیقه صبر کنید.',
    retryAfter: '15 minutes'
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: true,
      message: 'تعداد تلاش‌های ورود بیش از حد مجاز است. لطفاً ۱۵ دقیقه صبر کنید.',
      retryAfter: '15 minutes'
    });
  },
  // Custom key generator to track by IP
  keyGenerator: (req: Request): string => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
});

// General API rate limiter for additional protection
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    message: 'درخواست‌های بیش از حد. لطفاً کمی صبر کنید.',
    retryAfter: '15 minutes'
  }
});

// Strict rate limiter for sensitive operations
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: true,
    message: 'عملیات محدود شده. لطفاً یک ساعت صبر کنید.',
    retryAfter: '1 hour'
  }
});