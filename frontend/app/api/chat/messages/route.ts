import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getUser } from '../../../../lib/auth';
import { validate, sendMessageSchema } from '../../../../lib/validations';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = getUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = validate(sendMessageSchema, body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.errors[0].message, errors: validation.errors }, { status: 400 });
  }

  const { recipientId, content } = validation.data;

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
