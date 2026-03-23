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

    const db = getDb();

    let count;
    try {
      const result = await db.query(
        'SELECT COUNT(*) AS cnt FROM chat_messages WHERE recipient_id = $1 AND is_read = false',
        [meId]
      );
      count = parseInt(result.rows[0]?.cnt || '0', 10);
    } catch (dbErr) {
      console.error('[CHAT/UNREAD] DB error:', dbErr.message);
      return Response.json({ error: 'Database error', details: dbErr.message }, { status: 500 });
    }

    return Response.json({ unread: count });
  } catch (err) {
    console.error('[CHAT/UNREAD] Unexpected error:', err.message);
    return Response.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}
