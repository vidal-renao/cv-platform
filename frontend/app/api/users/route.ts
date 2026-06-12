import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '../../../lib/db';
import { getUser, type UserPayload } from '../../../lib/auth';
import { assignableRolesFor, isAdminUser } from '../../../lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

function isOnline(lastSeen: string | null): boolean {
  return Boolean(lastSeen && Date.now() - new Date(lastSeen).getTime() < ONLINE_THRESHOLD_MS);
}

export async function GET(request: Request) {
  const user = getUser(request);
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
  }

  try {
    const db = getDb();
    const result = await db.query(
      'SELECT id, email, role, created_at, last_seen FROM users ORDER BY created_at DESC'
    );
    return NextResponse.json(result.rows.map((row) => ({ ...row, is_online: isOnline(row.last_seen) })));
  } catch (err) {
    console.error('[USERS_GET_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = getUser(request);
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
  }

  let body: { email?: string; password?: string; role?: UserPayload['role'] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  const role = body.role;
  const allowedRoles = assignableRolesFor(user);

  if (!email || !password || !role) {
    return NextResponse.json({ error: 'email, password, and role are required' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: `You cannot assign the role: ${role}` }, { status: 403 });
  }

  try {
    const db = getDb();
    const exists = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (exists.rows.length > 0) {
      return NextResponse.json({ error: 'A user with that email already exists' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING id, email, role, created_at`,
      [email, passwordHash, role]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err) {
    console.error('[USERS_POST_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
