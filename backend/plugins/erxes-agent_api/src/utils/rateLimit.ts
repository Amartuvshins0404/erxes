import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';

// Per-IP throttle for the plugin's LLM-backed voice routes. Normal voice traffic
// stays well under it; it only blunts abnormal high-frequency bursts (and the
// OpenAI cost they would incur). Same shape as the chat-stream limiter so the
// two never drift far apart.
export function makeIpRateLimiter(): RateLimitRequestHandler {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.',
  });
}
