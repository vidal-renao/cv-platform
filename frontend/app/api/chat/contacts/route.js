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

    let usersResult;
    try {
      if (meRole === 'CLIENT') {
        usersResult = await db.query(
          "SELECT id, email, username, role, last_seen FROM users WHERE role IN ('SUPERADMIN','ADMIN') AND id != $1 ORDER BY username ASC",
          [meId]
        );
      } else if (meRole === 'STAFF') {
        usersResult = await db.query(
          "SELECT id, email, username, role, last_seen FROM users WHERE role IN ('SUPERADMIN','ADMIN','STAFF') AND id != $1 ORDER BY username ASC",
          [meId]
        );
      } else {
        // ADMIN or SUPERADMIN: all users except self
        usersResult = await db.query(
          'SELECT id, email, username, role, last_seen FROM users WHERE id != $1 ORDER BY username ASC',
          [meId]
        );
      }
    } catch (dbErr) {
      console.error('[CHAT/CONTACTS] DB error:', dbErr.message);
      return Response.json({ error: 'Database error', details: dbErr.message }, { status: 500 });
    }

    const contacts = [];
    for (const user of usersResult.rows) {
      let unreadCount = 0;
      try {
        const unreadResult = await db.query(
          'SELECT COUNT(*) AS cnt FROM chat_messages WHERE sender_id = $1 AND recipient_id = $2 AND is_read = false',
          [user.id, meId]
        );
        unreadCount = parseInt(unreadResult.rows[0]?.cnt || '0', 10);
      } catch {
        unreadCount = 0;
      }

      contacts.push({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        last_seen: user.last_seen,
        unread: unreadCount,
      });
    }

    return Response.json(contacts);
  } catch (err) {
    console.error('[CHAT/CONTACTS] Unexpected error:', err.message);
    return Response.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}
