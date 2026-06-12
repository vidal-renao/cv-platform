import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getUser } from '../../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const INTERNAL_ROLES = ['SUPERADMIN', 'ADMIN', 'STAFF'];
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

export async function GET(request: Request) {
  const user = getUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getDb();
    const roles = user.role === 'CLIENT' ? ['SUPERADMIN', 'ADMIN'] : INTERNAL_ROLES;
    const result = await db.query(
      `SELECT u.id, u.email, u.role, u.last_seen,
              COUNT(m.id) FILTER (WHERE m.is_read = FALSE AND m.recipient_id = $1) AS unread
       FROM users u
       LEFT JOIN chat_messages m
         ON m.sender_id = u.id AND m.recipient_id = $1
       WHERE u.id <> $1
         AND u.role = ANY($2::text[])
       GROUP BY u.id
       ORDER BY u.role, u.email`,
      [user.id, roles]
    );

    return NextResponse.json(result.rows.map((contact) => ({
      ...contact,
      unread: Number(contact.unread) || 0,
      is_online: contact.last_seen
        ? Date.now() - new Date(contact.last_seen).getTime() < ONLINE_THRESHOLD_MS
        : false,
    })));
  } catch (err) {
    console.error('[CHAT_CONTACTS_GET_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
