export const runtime = 'nodejs';

import bcrypt from 'bcryptjs';
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

function randomPassword(length = 10) {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// POST /api/clients/[id]/resend-access — reset password and return new credentials
export async function POST(request, { params }) {
  const me = getUser(request);
  if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['SUPERADMIN', 'ADMIN', 'STAFF'].includes(me.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const db = getDb();

    const clientRes = await db.query(`SELECT * FROM clients WHERE id = $1`, [params.id]);
    if (clientRes.rows.length === 0) return Response.json({ error: 'Client not found' }, { status: 404 });
    const client = clientRes.rows[0];

    if (!client.email) {
      return Response.json({ error: 'Client has no email' }, { status: 400 });
    }

    const tempPassword = randomPassword();
    const hash = await bcrypt.hash(tempPassword, 10);

    await db.query(
      `UPDATE users SET password_hash = $1, password = $2 WHERE LOWER(email) = LOWER($3) AND role = 'CLIENT'`,
      [hash, hash, client.email]
    );

    return Response.json({
      email: client.email,
      tempPassword,
      phone: client.phone,
      notifications: { email: false, whatsapp: false },
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
