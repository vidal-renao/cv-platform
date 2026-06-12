import { getDb } from '../../../lib/db';
import type { UserPayload } from '../../../lib/auth';

export async function resolveClientRecord(user: UserPayload) {
  const db = getDb();
  const result = await db.query(
    'SELECT * FROM clients WHERE LOWER(email) = LOWER($1) LIMIT 1',
    [user.email]
  );
  return result.rows[0] || null;
}
