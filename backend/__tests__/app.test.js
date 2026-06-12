process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_32_chars_minimum_value';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://user:pass@localhost:5432/cv_platform_test';
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 're_test_key';

const request = require('supertest');
const express = require('express');
const app = require('../src');
const { authenticateToken } = require('../src/middlewares/auth');
const { requireRole } = require('../src/middlewares/requireRole');

jest.mock('../src/db', () => ({
  query: jest.fn(() => Promise.resolve({ rows: [] })),
}));

describe('cv-platform backend smoke tests', () => {
  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok' });
    expect(res.body.requestId).toBeTruthy();
  });

  test('unknown routes return JSON 404', async () => {
    const res = await request(app).get('/api/not-real');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Route not found' });
  });

  test('protected auth route rejects missing token', async () => {
    const res = await request(app)
      .post('/api/auth/change-password')
      .send({ currentPassword: 'old', newPassword: 'new-password' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Missing token' });
  });
});

describe('role middleware', () => {
  test('requireRole denies users without an allowed role', async () => {
    const roleApp = express();
    roleApp.get('/admin', (req, _res, next) => {
      req.user = { id: 'user-1', role: 'CLIENT' };
      next();
    }, requireRole('ADMIN'), (_req, res) => res.json({ ok: true }));

    const res = await request(roleApp).get('/admin');

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Access denied' });
  });

  test('authenticateToken rejects malformed bearer token', async () => {
    const authApp = express();
    authApp.get('/protected', authenticateToken, (_req, res) => res.json({ ok: true }));

    const res = await request(authApp)
      .get('/protected')
      .set('Authorization', 'Bearer malformed-token');

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Invalid or expired token' });
  });
});
