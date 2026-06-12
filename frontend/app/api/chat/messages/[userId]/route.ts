import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getUser } from '../../../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const user = getUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getDb();
    const result = await db.query(
      `SELECT id, sender_id, recipient_id, content, is_read, created_at
       FROM chat_messages
       WHERE (sender_id = $1 AND recipient_id = $2)
          OR (sender_id = $2 AND recipient_id = $1)
       ORDER BY created_at ASC
       LIMIT 200`,
      [user.id, userId]
    );

    await db.query(
      `UPDATE chat_messages SET is_read = TRUE
       WHERE sender_id = $1 AND recipient_id = $2 AND is_read = FALSE`,
      [userId, user.id]
    );

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error('[CHAT_MESSAGES_GET_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
