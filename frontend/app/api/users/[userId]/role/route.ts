import { NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { getUser, type UserPayload } from '../../../../../lib/auth';
import { assignableRolesFor, isAdminUser } from '../../../../../lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const user = getUser(request);
  if (!isAdminUser(user)) {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
  }

  let body: { role?: UserPayload['role'] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const role = body.role;
  const allowedRoles = assignableRolesFor(user);
  if (!role || !allowedRoles.includes(role)) {
    return NextResponse.json({ error: `Role must be one of: ${allowedRoles.join(', ')}` }, { status: 400 });
  }
  if (userId === user.id) {
    return NextResponse.json({ error: 'You cannot change your own role.' }, { status: 400 });
  }

  try {
    const db = getDb();
    const result = await db.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, role',
      [role, userId]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error('[USER_ROLE_PATCH_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
