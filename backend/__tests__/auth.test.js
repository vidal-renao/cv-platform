process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_32_chars_minimum_value';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://user:pass@localhost:5432/cv_platform_test';
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || 're_test_key';

const db = require('../src/db');

jest.mock('../src/db', () => ({
  query: jest.fn(),
}));

const { register, login, changePassword } = require('../src/controllers/auth');

function mockRes() {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return res;
}

function mockReq(overrides = {}) {
  return { params: {}, body: {}, user: { id: 'user-1', role: 'ADMIN', email: 'admin@test.com' }, ...overrides };
}

describe('auth controller', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('register', () => {
    test('creates a new user with STAFF role', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [] })  // email check in clients
        .mockResolvedValueOnce({ rows: [{ id: 'u1', email: 'new@test.com', role: 'STAFF', created_at: new Date() }] });

      const res = mockRes();
      await register(mockReq({ body: { email: 'new@test.com', password: 'pass123' } }), res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'new@test.com', role: 'STAFF' })
      );
    });

    test('assigns CLIENT role when email matches known client', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id: 'client-1' }] })  // email match
        .mockResolvedValueOnce({ rows: [{ id: 'u1', email: 'c@test.com', role: 'CLIENT', created_at: new Date() }] });

      const res = mockRes();
      await register(mockReq({ body: { email: 'c@test.com', password: 'pass123' } }), res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'CLIENT' })
      );
    });
  });

  describe('login', () => {
    test('returns token for valid credentials', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('pass123', 10);
      db.query.mockResolvedValue({
        rows: [{ id: 'u1', email: 'user@test.com', role: 'STAFF', password_hash: hash }],
      });

      const res = mockRes();
      await login(mockReq({ body: { email: 'user@test.com', password: 'pass123' } }), res, jest.fn());

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ token: expect.any(String) })
      );
    });

    test('returns 401 for invalid credentials', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const res = mockRes();
      await login(mockReq({ body: { email: 'nobody@test.com', password: 'wrong' } }), res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    test('returns 401 for wrong password', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('correct', 10);
      db.query.mockResolvedValue({
        rows: [{ id: 'u1', email: 'user@test.com', role: 'STAFF', password_hash: hash }],
      });

      const res = mockRes();
      await login(mockReq({ body: { email: 'user@test.com', password: 'wrong' } }), res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('changePassword', () => {
    test('updates password when current is correct', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('oldpass', 10);
      db.query
        .mockResolvedValueOnce({ rows: [{ password_hash: hash }] })
        .mockResolvedValueOnce({});

      const res = mockRes();
      await changePassword(
        mockReq({ body: { currentPassword: 'oldpass', newPassword: 'newpass123' } }),
        res,
        jest.fn()
      );

      expect(res.json).toHaveBeenCalledWith({ message: 'Password updated successfully' });
    });

    test('returns 401 when current password is wrong', async () => {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('correct', 10);
      db.query.mockResolvedValue({ rows: [{ password_hash: hash }] });

      const res = mockRes();
      await changePassword(
        mockReq({ body: { currentPassword: 'wrong', newPassword: 'newpass123' } }),
        res,
        jest.fn()
      );

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
