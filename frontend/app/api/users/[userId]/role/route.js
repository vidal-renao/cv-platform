export const runtime = 'nodejs';

import jwt from 'jsonwebtoken';
import { getDb } from '../../../../../lib/db';

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

// PATCH /api/users/[userId]/role — change a user's role
export async function PATCH(request, { params }) {
  const me = getUser(request);
  if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['SUPERADMIN', 'ADMIN'].includes(me.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { role } = body ?? {};
  const allowed = me.role === 'SUPERADMIN'
    ? ['SUPERADMIN', 'ADMIN', 'STAFF', 'CLIENT']
    : ['STAFF', 'CLIENT'];

  if (!allowed.includes(role)) {
    return Response.json({ error: `You cannot assign role ${role}` }, { status: 403 });
  }

  const { userId } = params;
  if (userId === me.id) {
    return Response.json({ error: 'Cannot change your own role' }, { status: 400 });
  }

  try {
    const db = getDb();
    const result = await db.query(
      `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, role`,
      [role, userId]
    );
    if (result.rows.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    return Response.json(result.rows[0]);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
