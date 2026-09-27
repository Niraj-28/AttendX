/**
 * Simple rate limiter middleware
 * Prevents brute force attacks on authentication endpoints
 */

const requestCounts = new Map();

const rateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 5, // 5 requests per window
    message = 'Too many requests, please try again later'
  } = options;

  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    
    if (!requestCounts.has(key)) {
      requestCounts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const record = requestCounts.get(key);

    if (now > record.resetTime) {
      // Reset if window has passed
      requestCounts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (record.count >= max) {
      const timeLeft = Math.ceil((record.resetTime - now) / 1000);
      return res.status(429).json({
        status: 'error',
        message: message,
        retryAfter: timeLeft
      });
    }

    record.count++;
    next();
  };
};

// Cleanup old entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 60 * 60 * 1000);

module.exports = rateLimiter;
