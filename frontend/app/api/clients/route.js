export const runtime = 'nodejs';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../../../lib/db';

function getUser(request) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'cvplatform_super_secure_key_2026');
  } catch {
    return null;
  }
}

async function ensureClientsTable(db) {
  await db.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
  await db.query(`
    CREATE TABLE IF NOT EXISTS clients (
      id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id    TEXT,
      name       VARCHAR(255) NOT NULL,
      phone      VARCHAR(50),
      email      VARCHAR(255),
      address    TEXT,
      status     VARCHAR(50)  DEFAULT 'active',
      created_at TIMESTAMPTZ  DEFAULT NOW()
    )
  `);
  // If table was already created with UUID type, relax it to TEXT so integer IDs work
  try {
    await db.query(`ALTER TABLE clients ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT`);
    await db.query(`ALTER TABLE clients ALTER COLUMN user_id DROP NOT NULL`);
  } catch { /* already TEXT or no column — ignore */ }
}

// GET /api/clients — list all clients (ADMIN/SUPERADMIN/STAFF)
export async function GET(request) {
  const me = getUser(request);
  if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['SUPERADMIN', 'ADMIN', 'STAFF'].includes(me.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const db = getDb();
    await ensureClientsTable(db);
    const result = await db.query(`
      SELECT c.*,
        EXISTS(
          SELECT 1 FROM users u WHERE LOWER(u.email) = LOWER(c.email) AND u.role = 'CLIENT'
        ) AS has_account
      FROM clients c
      ORDER BY c.created_at DESC
    `);
    return Response.json(result.rows);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/clients — create a client record
export async function POST(request) {
  const me = getUser(request);
  if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['SUPERADMIN', 'ADMIN', 'STAFF'].includes(me.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, phone, email, address } = body ?? {};
  if (!name) return Response.json({ error: 'Name is required' }, { status: 400 });

  try {
    const db = getDb();
    await ensureClientsTable(db);
    const result = await db.query(
      `INSERT INTO clients (user_id, name, phone, email, address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [me.id, name.trim(), phone?.trim() || null, email?.trim().toLowerCase() || null, address?.trim() || null]
    );
    return Response.json({ ...result.rows[0], has_account: false }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
