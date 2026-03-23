export const runtime = 'nodejs';

import jwt from 'jsonwebtoken';
import { getDb } from '../../../../../lib/db';

export async function GET(request, { params }) {
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
    const { userId } = params;

    const db = getDb();

    // If CLIENT, only allow fetching messages with SUPERADMIN or ADMIN
    if (meRole === 'CLIENT') {
      let targetUser;
      try {
        const result = await db.query('SELECT role FROM users WHERE id = $1', [userId]);
        targetUser = result.rows[0];
      } catch (dbErr) {
        console.error('[CHAT/MESSAGES/userId] DB error:', dbErr.message);
        return Response.json({ error: 'Database error', details: dbErr.message }, { status: 500 });
      }

      if (!targetUser) {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }

      if (!['SUPERADMIN', 'ADMIN'].includes(targetUser.role)) {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    let messages;
    try {
      const result = await db.query(
        `SELECT id, sender_id, recipient_id, content, is_read, created_at
         FROM chat_messages
         WHERE (sender_id = $1 AND recipient_id = $2)
            OR (sender_id = $2 AND recipient_id = $1)
         ORDER BY created_at ASC`,
        [meId, userId]
      );
      messages = result.rows;
    } catch (dbErr) {
      console.error('[CHAT/MESSAGES/userId] DB query error:', dbErr.message);
      return Response.json({ error: 'Database error', details: dbErr.message }, { status: 500 });
    }

    // Mark messages from userId to me as read
    try {
      await db.query(
        'UPDATE chat_messages SET is_read = true WHERE sender_id = $1 AND recipient_id = $2 AND is_read = false',
        [userId, meId]
      );
    } catch (dbErr) {
      console.error('[CHAT/MESSAGES/userId] Mark read error:', dbErr.message);
      // Non-fatal — still return messages
    }

    return Response.json(messages);
  } catch (err) {
    console.error('[CHAT/MESSAGES/userId] Unexpected error:', err.message);
    return Response.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}
