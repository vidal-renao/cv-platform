import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getUser } from '../../../../lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = getUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { recipientId?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const recipientId = String(body.recipientId || '').trim();
  const content = String(body.content || '').trim();
  if (!recipientId || !content) {
    return NextResponse.json({ error: 'recipientId and content are required' }, { status: 400 });
  }
  if (content.length > 2000) {
    return NextResponse.json({ error: 'Message too long (max 2000 chars)' }, { status: 400 });
  }
  if (recipientId === user.id) {
    return NextResponse.json({ error: 'Cannot send a message to yourself' }, { status: 400 });
  }

  try {
    const db = getDb();
    const recipient = await db.query('SELECT id FROM users WHERE id = $1', [recipientId]);
    if (recipient.rows.length === 0) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    const result = await db.query(
      `INSERT INTO chat_messages (sender_id, recipient_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, sender_id, recipient_id, content, is_read, created_at`,
      [user.id, recipientId, content]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error('[CHAT_MESSAGES_POST_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
