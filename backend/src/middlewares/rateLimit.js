const buckets = new Map();

function numberFromEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function isEnabled() {
  return process.env.RATE_LIMIT_ENABLED !== 'false';
}

function categoryForPath(path) {
  if (/^\/api\/auth\/(login|register|forgot-password|reset-password)/.test(path)) {
    return 'auth';
  }
  if (/^\/api\/clients\/[^/]+\/(generate-access|resend-access)/.test(path)) {
    return 'auth';
  }
  if (path === '/api/chat/messages') {
    return 'chat';
  }
  if (/^\/api\/packages\/[^/]+\/proof/.test(path)) {
    return 'upload';
  }
  return 'api';
}

function maxForCategory(category) {
  if (category === 'auth') return numberFromEnv('RATE_LIMIT_MAX_AUTH', 10);
  if (category === 'chat') return numberFromEnv('RATE_LIMIT_MAX_CHAT', 60);
  if (category === 'upload') return numberFromEnv('RATE_LIMIT_MAX_UPLOAD', 20);
  return numberFromEnv('RATE_LIMIT_MAX_API', 100);
}

function rateLimit(req, res, next) {
  if (!isEnabled() || req.method === 'OPTIONS' || req.path === '/health' || req.path === '/ready') {
    return next();
  }

  const windowMs = numberFromEnv('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000);
  const now = Date.now();
  const category = categoryForPath(req.path);
  const max = maxForCategory(category);
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const key = `${category}:${ip}`;
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return next();
  }

  current.count += 1;
  if (current.count > max) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    res.setHeader('Retry-After', String(retryAfter));
    return res.status(429).json({
      error: 'Too many requests',
      requestId: req.id,
    });
  }

  return next();
}

function resetRateLimitForTests() {
  buckets.clear();
}

module.exports = { rateLimit, resetRateLimitForTests };
