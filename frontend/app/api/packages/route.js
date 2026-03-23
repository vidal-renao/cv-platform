export const runtime = 'nodejs';

import jwt from 'jsonwebtoken';
import { getDb } from '../../../lib/db';

async function getCostPerKg(db) {
  try {
    const r = await db.query(`SELECT cost_per_kg FROM app_settings WHERE id = 1`);
    return parseFloat(r.rows[0]?.cost_per_kg) || 5.00;
  } catch { return 5.00; }
}

function getUser(request) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'cvplatform_super_secure_key_2026');
  } catch { return null; }
}

async function ensureTables(db) {
  await db.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
  await db.query(`
    CREATE TABLE IF NOT EXISTS packages (
      id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id         TEXT,
      client_id       TEXT         NOT NULL,
      tracking_number VARCHAR(100) UNIQUE NOT NULL,
      description     TEXT,
      weight          NUMERIC(10,2),
      cost            NUMERIC(10,2),
      status          VARCHAR(50)  DEFAULT 'ARRIVED',
      created_at      TIMESTAMPTZ  DEFAULT NOW()
    )
  `);
  // Drop FK constraints so we can alter column types (integer id vs UUID)
  try { await db.query(`ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_user_id_fkey`); } catch {}
  try { await db.query(`ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_client_id_fkey`); } catch {}
  // Relax NOT NULL and types
  try { await db.query(`ALTER TABLE packages ALTER COLUMN user_id DROP NOT NULL`); } catch {}
  try { await db.query(`ALTER TABLE packages ALTER COLUMN client_id DROP NOT NULL`); } catch {}
  try { await db.query(`ALTER TABLE packages ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT`); } catch {}
  try { await db.query(`ALTER TABLE packages ALTER COLUMN client_id TYPE TEXT USING client_id::TEXT`); } catch {}
  try { await db.query(`ALTER TABLE packages ADD COLUMN IF NOT EXISTS weight NUMERIC(10,2)`); } catch {}
  try { await db.query(`ALTER TABLE packages ADD COLUMN IF NOT EXISTS cost NUMERIC(10,2)`); } catch {}

  await db.query(`
    CREATE TABLE IF NOT EXISTS package_comments (
      id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      package_id   TEXT        NOT NULL,
      author_id    TEXT,
      author_email VARCHAR(255),
      author_role  VARCHAR(50),
      comment      TEXT        NOT NULL,
      is_internal  BOOLEAN     DEFAULT FALSE,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS delivery_proofs (
      id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      package_id     TEXT        NOT NULL UNIQUE,
      signature_data TEXT,
      photo_data     TEXT,
      notes          TEXT,
      created_at     TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

// GET /api/packages
export async function GET(request) {
  const me = getUser(request);
  if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['SUPERADMIN', 'ADMIN', 'STAFF'].includes(me.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const db = getDb();
    await ensureTables(db);
    const result = await db.query(`
      SELECT p.*, c.name AS client_name
      FROM packages p
      LEFT JOIN clients c ON c.id::text = p.client_id::text
      ORDER BY p.created_at DESC
    `);
    return Response.json(result.rows);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/packages
export async function POST(request) {
  const me = getUser(request);
  if (!me) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['SUPERADMIN', 'ADMIN', 'STAFF'].includes(me.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { tracking_number, client_id, description, weight } = body ?? {};
  if (!tracking_number) return Response.json({ error: 'tracking_number is required' }, { status: 400 });
  if (!client_id) return Response.json({ error: 'client_id is required' }, { status: 400 });

  const weightNum = weight != null && weight !== '' ? parseFloat(weight) : null;

  try {
    const db = getDb();
    await ensureTables(db);
    const costPerKg = await getCostPerKg(db);
    const cost = weightNum != null ? parseFloat((weightNum * costPerKg).toFixed(2)) : null;
    const result = await db.query(`
      INSERT INTO packages (client_id, tracking_number, description, weight, cost, status)
      VALUES ($1, $2, $3, $4, $5, 'ARRIVED')
      RETURNING *
    `, [String(client_id), tracking_number.trim(), description?.trim() || null, weightNum, cost]);

    // Fetch client name for response
    const clientRes = await db.query(`SELECT name FROM clients WHERE id::text = $1`, [String(client_id)]);
    const client_name = clientRes.rows[0]?.name || null;

    return Response.json({ ...result.rows[0], client_name }, { status: 201 });
  } catch (err) {
    if (err.message.includes('unique') || err.message.includes('duplicate')) {
      return Response.json({ error: 'Tracking number already exists' }, { status: 409 });
    }
    return Response.json({ error: err.message }, { status: 500 });
  }
}
