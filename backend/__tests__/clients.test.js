process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_32_chars_minimum_value';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://user:pass@localhost:5432/cv_platform_test';

const db = require('../src/db');

jest.mock('../src/db', () => ({
  query: jest.fn(),
}));

const { getClients, getClientById, createClient, updateClient, deleteClient } = require('../src/controllers/clients');

function mockRes() {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  return res;
}

function mockReq(overrides = {}) {
  return { params: {}, body: {}, user: { id: 'user-1', role: 'ADMIN', email: 'admin@test.com' }, ...overrides };
}

describe('clients controller', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getClients', () => {
    test('returns clients for authenticated user', async () => {
      const fakeClients = [{ id: 'c1', name: 'Alice', has_account: true }];
      db.query.mockResolvedValue({ rows: fakeClients });

      const res = mockRes();
      await getClients(mockReq(), res, jest.fn());

      expect(res.json).toHaveBeenCalledWith(fakeClients);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE c.user_id = $1'),
        ['user-1']
      );
    });

    test('calls next on db error', async () => {
      db.query.mockRejectedValue(new Error('db down'));
      const next = jest.fn();
      const res = mockRes();
      await getClients(mockReq(), res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getClientById', () => {
    test('returns client when found', async () => {
      db.query.mockResolvedValue({ rows: [{ id: 'c1', name: 'Bob' }] });

      const res = mockRes();
      await getClientById(mockReq({ params: { id: 'c1' } }), res, jest.fn());

      expect(res.json).toHaveBeenCalledWith({ id: 'c1', name: 'Bob' });
    });

    test('returns 404 when client not found', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const res = mockRes();
      await getClientById(mockReq({ params: { id: 'c1' } }), res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Client not found' });
    });
  });

  describe('createClient', () => {
    test('creates client with valid data', async () => {
      db.query.mockResolvedValue({ rows: [{ id: 'c1', name: 'New Client' }] });

      const res = mockRes();
      await createClient(mockReq({ body: { name: 'New Client', phone: '+41123456' } }), res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 'c1', name: 'New Client' });
    });

    test('returns 400 when name is missing', async () => {
      const res = mockRes();
      await createClient(mockReq({ body: { phone: '+41123456' } }), res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Name is required' });
    });
  });

  describe('updateClient', () => {
    test('updates client successfully', async () => {
      db.query.mockResolvedValue({ rows: [{ id: 'c1', name: 'Updated' }] });

      const res = mockRes();
      await updateClient(mockReq({ params: { id: 'c1' }, body: { name: 'Updated' } }), res, jest.fn());

      expect(res.json).toHaveBeenCalledWith({ id: 'c1', name: 'Updated' });
    });

    test('returns 404 when client not found', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const res = mockRes();
      await updateClient(mockReq({ params: { id: 'c1' }, body: { name: 'X' } }), res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteClient', () => {
    test('deletes client successfully', async () => {
      db.query.mockResolvedValue({ rows: [{ id: 'c1' }] });

      const res = mockRes();
      await deleteClient(mockReq({ params: { id: 'c1' } }), res, jest.fn());

      expect(res.json).toHaveBeenCalledWith({ message: 'Client deleted' });
    });

    test('returns 404 when client not found', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const res = mockRes();
      await deleteClient(mockReq({ params: { id: 'c1' } }), res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
