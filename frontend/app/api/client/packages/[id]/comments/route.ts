import { NextResponse } from 'next/server';
import { getDb } from '../../../../../../lib/db';
import { getUser } from '../../../../../../lib/auth';
import { resolveClientRecord } from '../../../_helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function canAccessClientPackage(packageId: string, clientId: string) {
  const db = getDb();
  const result = await db.query('SELECT id FROM packages WHERE id = $1 AND client_id = $2', [packageId, clientId]);
  return result.rows.length > 0;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = getUser(request);
  if (!user || user.role !== 'CLIENT') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const client = await resolveClientRecord(user);
    if (!client || !(await canAccessClientPackage(id, client.id))) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    const db = getDb();
    const result = await db.query(
      `SELECT pc.id, pc.comment, pc.is_internal, pc.created_at,
              u.email AS author_email, u.role AS author_role
       FROM package_comments pc
       JOIN users u ON u.id = pc.user_id
       WHERE pc.package_id = $1 AND pc.is_internal = FALSE
       ORDER BY pc.created_at ASC`,
      [id]
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error('[CLIENT_PACKAGE_COMMENTS_GET_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = getUser(request);
  if (!user || user.role !== 'CLIENT') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { comment?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const comment = String(body.comment || '').trim();
  if (!comment) {
    return NextResponse.json({ error: 'Comment cannot be empty' }, { status: 400 });
  }

  try {
    const client = await resolveClientRecord(user);
    if (!client || !(await canAccessClientPackage(id, client.id))) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    const db = getDb();
    const result = await db.query(
      `INSERT INTO package_comments (package_id, user_id, comment, is_internal)
       VALUES ($1, $2, $3, FALSE)
       RETURNING *`,
      [id, user.id, comment]
    );

    return NextResponse.json({ ...result.rows[0], author_email: user.email, author_role: 'CLIENT' }, { status: 201 });
  } catch (err) {
    console.error('[CLIENT_PACKAGE_COMMENTS_POST_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
