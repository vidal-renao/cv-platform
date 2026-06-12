import { NextResponse } from 'next/server';
import { getDb } from '../../../../../../lib/db';
import { getUser } from '../../../../../../lib/auth';
import { isInternalUser } from '../../../../../../lib/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { id, commentId } = await params;
  const user = getUser(request);
  if (!isInternalUser(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const db = getDb();
    const result = await db.query(
      `DELETE FROM package_comments pc
       USING packages p
       WHERE pc.id = $1
         AND pc.package_id = p.id
         AND p.id = $2
         AND ($3::boolean OR p.user_id = $4)
       RETURNING pc.id`,
      [commentId, id, user.role === 'SUPERADMIN', user.id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Deleted' });
  } catch (err) {
    console.error('[PACKAGE_COMMENT_DELETE_ERROR]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
