export const runtime = 'nodejs';

import jwt from 'jsonwebtoken';
import { getDb } from '../../../../lib/db';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

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
    const { recipientId, content } = body ?? {};

    if (!recipientId) {
      return Response.json({ error: 'recipientId is required' }, { status: 400 });
    }

    if (!content || typeof content !== 'string') {
      return Response.json({ error: 'content is required' }, { status: 400 });
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length < 1 || trimmedContent.length > 2000) {
      return Response.json({ error: 'content must be between 1 and 2000 characters' }, { status: 400 });
    }

    const db = getDb();

    // Get recipient role
    let recipient;
    try {
      const result = await db.query('SELECT id, role FROM users WHERE id = $1', [recipientId]);
      recipient = result.rows[0];
    } catch (dbErr) {
      console.error('[CHAT/MESSAGES] DB error fetching recipient:', dbErr.message);
      return Response.json({ error: 'Database error', details: dbErr.message }, { status: 500 });
    }

    if (!recipient) {
      return Response.json({ error: 'Recipient not found' }, { status: 404 });
    }

    const recipientRole = recipient.role;

    // Permission check
    if (meRole === 'CLIENT') {
      if (!['SUPERADMIN', 'ADMIN'].includes(recipientRole)) {
        return Response.json({ error: 'Forbidden: clients can only message ADMIN or SUPERADMIN' }, { status: 403 });
      }
    } else if (meRole === 'STAFF') {
      if (!['SUPERADMIN', 'ADMIN', 'STAFF'].includes(recipientRole)) {
        return Response.json({ error: 'Forbidden: staff cannot message clients' }, { status: 403 });
      }
    }
    // ADMIN and SUPERADMIN can message anyone — no restriction needed

    // Insert message
    let inserted;
    try {
      const result = await db.query(
        `INSERT INTO chat_messages (sender_id, recipient_id, content, is_read, created_at)
         VALUES ($1, $2, $3, false, NOW())
         RETURNING id, sender_id, recipient_id, content, is_read, created_at`,
        [meId, recipientId, trimmedContent]
      );
      inserted = result.rows[0];
    } catch (dbErr) {
      console.error('[CHAT/MESSAGES] DB insert error:', dbErr.message);
      return Response.json({ error: 'Database error', details: dbErr.message }, { status: 500 });
    }

    // Update sender's last_seen (fire-and-forget)
    try {
      db.query('UPDATE users SET last_seen = NOW() WHERE id = $1', [meId]).catch(() => {});
    } catch { /* ignore */ }

    return Response.json(inserted, { status: 201 });
  } catch (err) {
    console.error('[CHAT/MESSAGES] Unexpected error:', err.message);
    return Response.json({ error: 'Internal server error', details: err.message }, { status: 500 });
  }
}
