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

// GET /api/users — list all users (ADMIN/SUPERADMIN only)
export async function GET(request) {
  const me = getUser(request);
  if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['SUPERADMIN', 'ADMIN'].includes(me.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const db = getDb();
    const result = await db.query(
      `SELECT id, email, username, role, created_at, last_seen
       FROM users WHERE role != 'CLIENT' ORDER BY created_at ASC`
    );
    return Response.json(result.rows);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/users — create a new user (ADMIN/SUPERADMIN only)
export async function POST(request) {
  const me = getUser(request);
  if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['SUPERADMIN', 'ADMIN'].includes(me.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { email, password, role } = body ?? {};
  if (!email || !password || !role) {
    return Response.json({ error: 'email, password and role are required' }, { status: 400 });
  }
  if (password.length < 6) {
    return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  // ADMIN cannot create SUPERADMIN or another ADMIN
  const allowed = me.role === 'SUPERADMIN'
    ? ['SUPERADMIN', 'ADMIN', 'STAFF', 'CLIENT']
    : ['STAFF', 'CLIENT'];
  if (!allowed.includes(role)) {
    return Response.json({ error: `You cannot create a user with role ${role}` }, { status: 403 });
  }

  try {
    const db = getDb();
    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (email, password_hash, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, role, created_at`,
      [email.trim().toLowerCase(), hash, hash, role]
    );
    return Response.json(result.rows[0], { status: 201 });
  } catch (err) {
    if (err.message.includes('unique') || err.message.includes('duplicate')) {
      return Response.json({ error: 'Email already exists' }, { status: 409 });
    }
    return Response.json({ error: err.message }, { status: 500 });
  }
}
