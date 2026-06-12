import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getUser } from '../../../../../lib/auth';
import { isInternalUser } from '../../../../../lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function canAccessPackage(packageId: string, userId: string, role: string) {
  const db = getDb();
  const result = await db.query(
    role === 'SUPERADMIN'
      ? 'SELECT id FROM packages WHERE id = $1'
      : 'SELECT id FROM packages WHERE id = $1 AND user_id = $2',
    role === 'SUPERADMIN' ? [packageId] : [packageId, userId]
  );
  return result.rows.length > 0;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = getUser(request);
  if (!isInternalUser(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    if (!(await canAccessPackage(id, user.id, user.role))) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    const db = getDb();
    const result = await db.query(
      `SELECT pc.*, u.email AS author_email, u.role AS author_role
       FROM package_comments pc
       JOIN users u ON u.id = pc.user_id
       WHERE pc.package_id = $1
       ORDER BY pc.created_at ASC`,
      [id]
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error('[PACKAGE_COMMENTS_GET_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = getUser(request);
  if (!isInternalUser(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { comment?: string; is_internal?: boolean };
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
    if (!(await canAccessPackage(id, user.id, user.role))) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    const db = getDb();
    const result = await db.query(
      `INSERT INTO package_comments (package_id, user_id, comment, is_internal)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, user.id, comment, Boolean(body.is_internal)]
    );
    return NextResponse.json({ ...result.rows[0], author_email: user.email, author_role: user.role }, { status: 201 });
  } catch (err) {
    console.error('[PACKAGE_COMMENTS_POST_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
