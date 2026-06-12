import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getUser } from '../../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const user = getUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getDb();
    const result = await db.query(
      'SELECT COUNT(*)::int AS total FROM chat_messages WHERE recipient_id = $1 AND is_read = FALSE',
      [user.id]
    );
    return NextResponse.json({ unread: Number(result.rows[0]?.total) || 0 });
  } catch (err) {
    console.error('[CHAT_UNREAD_GET_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
