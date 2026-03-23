export const runtime = 'nodejs';

import jwt from 'jsonwebtoken';
import { getDb } from '../../../../lib/db';

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || 'cvplatform_super_secure_key_2026');
    } catch {
      return Response.json({ error: 'Invalid token' }, { status: 401 });
    }

    const meId = payload.id;

    const db = getDb();

    try {
      await db.query('UPDATE users SET last_seen = NOW() WHERE id = $1', [meId]);
    } catch (dbErr) {
      console.error('[HEARTBEAT] DB error:', dbErr.message);
      return Response.json({ error: 'Database error', details: dbErr.message }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error('[HEARTBEAT] Unexpected error:', err.message);
    return Response.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}
