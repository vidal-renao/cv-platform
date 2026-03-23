export const runtime = 'nodejs';

import jwt from 'jsonwebtoken';
import { getDb } from '../../../../lib/db';

function getUser(request) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'cvplatform_super_secure_key_2026');
  } catch { return null; }
}

// GET /api/client/me
export async function GET(request) {
  const me = getUser(request);
  if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = getDb();
    const result = await db.query(
      `SELECT id, name, email, phone, status FROM clients WHERE LOWER(email) = LOWER($1)`,
      [me.email]
    );
    if (result.rows.length === 0) {
      // Return basic info from JWT if no client record
      return Response.json({ email: me.email, name: me.email.split('@')[0] });
    }
    return Response.json(result.rows[0]);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
