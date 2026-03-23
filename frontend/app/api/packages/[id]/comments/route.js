export const runtime = 'nodejs';

import jwt from 'jsonwebtoken';
import { getDb } from '../../../../../lib/db';

function getUser(request) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'cvplatform_super_secure_key_2026');
  } catch { return null; }
}

// GET /api/packages/[id]/comments
export async function GET(request, { params }) {
  const me = getUser(request);
  if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = getDb();
    const result = await db.query(
      `SELECT * FROM package_comments WHERE package_id = $1 ORDER BY created_at ASC`,
      [params.id]
    );
    return Response.json(result.rows);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/packages/[id]/comments
export async function POST(request, { params }) {
  const me = getUser(request);
  if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { comment, is_internal } = body ?? {};
  if (!comment?.trim()) return Response.json({ error: 'comment is required' }, { status: 400 });

  // Only staff/admin can post internal notes
  const internal = is_internal && ['SUPERADMIN', 'ADMIN', 'STAFF'].includes(me.role);

  try {
    const db = getDb();
    const result = await db.query(`
      INSERT INTO package_comments (package_id, author_id, author_email, author_role, comment, is_internal)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [params.id, String(me.id), me.email, me.role, comment.trim(), internal]);
    return Response.json(result.rows[0], { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
