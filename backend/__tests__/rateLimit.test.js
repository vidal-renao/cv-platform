const express = require('express');
const request = require('supertest');
const { rateLimit, resetRateLimitForTests } = require('../src/middlewares/rateLimit');

const originalEnv = { ...process.env };

function buildApp() {
  const app = express();

  app.use((req, res, next) => {
    req.id = 'test-request-id';
    res.setHeader('X-Request-ID', req.id);
    next();
  });

  app.use(rateLimit);
  app.post('/api/auth/login', (_req, res) => res.json({ ok: true }));
  app.options('/api/auth/login', (_req, res) => res.status(204).send());
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  return app;
}

describe('rateLimit middleware', () => {
  beforeEach(() => {
    process.env.RATE_LIMIT_ENABLED = 'true';
    process.env.RATE_LIMIT_WINDOW_MS = '60000';
    process.env.RATE_LIMIT_MAX_AUTH = '2';
    resetRateLimitForTests();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    resetRateLimitForTests();
  });

  test('blocks auth requests after the configured threshold', async () => {
    const app = buildApp();

    await request(app).post('/api/auth/login').expect(200);
    await request(app).post('/api/auth/login').expect(200);

    const res = await request(app).post('/api/auth/login').expect(429);

    expect(res.headers['retry-after']).toBe('60');
    expect(res.body).toEqual({
      error: 'Too many requests',
      requestId: 'test-request-id',
    });
  });

  test('does not rate limit health checks', async () => {
    const app = buildApp();

    await request(app).get('/health').expect(200);
    await request(app).get('/health').expect(200);
    await request(app).get('/health').expect(200);
  });

  test('does not rate limit OPTIONS preflight requests', async () => {
    const app = buildApp();

    await request(app).options('/api/auth/login').expect(204);
    await request(app).options('/api/auth/login').expect(204);
    await request(app).options('/api/auth/login').expect(204);
  });

  test('can be disabled by environment', async () => {
    process.env.RATE_LIMIT_ENABLED = 'false';
    process.env.RATE_LIMIT_MAX_AUTH = '1';
    const app = buildApp();

    await request(app).post('/api/auth/login').expect(200);
    await request(app).post('/api/auth/login').expect(200);
  });
});
