export const runtime = 'nodejs';

import jwt from 'jsonwebtoken';
import { getDb } from '../../../../lib/db';

export async function GET(request) {
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
    const meRole = payload.role;

    const db = getDb();

    let roleFilter;
    if (meRole === 'CLIENT') {
      roleFilter = "AND u.role IN ('SUPERADMIN','ADMIN')";
    } else if (meRole === 'STAFF') {
      roleFilter = "AND u.role IN ('SUPERADMIN','ADMIN','STAFF')";
    } else {
      roleFilter = "AND u.role != 'CLIENT'";
    }

    let usersResult;
    try {
      usersResult = await db.query(
        `SELECT u.id, u.email, u.username, u.role, u.last_seen,
           COALESCE(
             (SELECT COUNT(*) FROM chat_messages cm
              WHERE cm.sender_id = u.id AND cm.recipient_id = $1 AND cm.is_read = false),
             0
           )::int AS unread
         FROM users u
         WHERE u.id::text != $1::text ${roleFilter}
         ORDER BY u.username ASC`,
        [meId]
      );
    } catch (dbErr) {
      console.error('[CHAT/CONTACTS] DB error:', dbErr.message);
      return Response.json({ error: 'Database error', details: dbErr.message }, { status: 500 });
    }

    return Response.json(usersResult.rows);
  } catch (err) {
    console.error('[CHAT/CONTACTS] Unexpected error:', err.message);
    return Response.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}
