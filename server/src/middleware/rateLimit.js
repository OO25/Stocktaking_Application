const buckets = new Map();

/**
 * Simple in-memory rate limiter middleware.
 * Good for local/dev and single-instance deployments.
 */
export function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 10 } = {}) {
  return function rateLimit(req, res, next) {
    const key = req.ip || req.connection?.remoteAddress || "unknown";
    const now = Date.now();
    const entry = buckets.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = now + windowMs;
    }

    entry.count += 1;
    buckets.set(key, entry);

    const remaining = Math.max(max - entry.count, 0);
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > max) {
      return res.status(429).json({ message: "Too many requests. Please try again later." });
    }

    return next();
  };
}
