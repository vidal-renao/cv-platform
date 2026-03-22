export const runtime = 'nodejs';

/**
 * POST /api/seed
 *
 * Creates (or updates) demo user accounts and ensures the DB schema has all
 * required columns.  Safe to call multiple times — uses UPSERT logic.
 *
 * Auth: requires header  x-setup-key = SETUP_KEY env var (falls back to JWT_SECRET).
 *
 * GET /api/seed  →  lists existing users (emails + roles, no hashes) for verification.
 */

import bcrypt from 'bcryptjs';
import { getDb } from '../../../lib/db';

const DEMO_USERS = [
  { username: 'admin',  email: 'admin@demo.com',  password: '123456', role: 'ADMIN'  },
  { username: 'staff',  email: 'staff@demo.com',  password: '123456', role: 'STAFF'  },
  { username: 'client', email: 'client@demo.com', password: '123456', role: 'CLIENT' },
];

// ─── Auth guard ──────────────────────────────────────────────────────────────
function isAuthorized(request) {
  const setupKey = process.env.SETUP_KEY || process.env.JWT_SECRET;
  if (!setupKey) return true; // no key configured → allow (dev mode)
  // Accept key via header OR ?key= query param
  const headerKey = request.headers.get('x-setup-key');
  const urlKey = new URL(request.url).searchParams.get('key');
  return headerKey === setupKey || urlKey === setupKey;
}

// ─── Ensure schema has required columns ──────────────────────────────────────
async function ensureColumns(db) {
  const migrations = [
    `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,
    `CREATE TABLE IF NOT EXISTS users (
       id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
       email         VARCHAR(255) UNIQUE NOT NULL,
       password_hash VARCHAR(255) NOT NULL,
       created_at    TIMESTAMPTZ  DEFAULT NOW()
     )`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS username  VARCHAR(255)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS role      VARCHAR(50)  DEFAULT 'CLIENT'`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS name      VARCHAR(255)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ`,
    `CREATE TABLE IF NOT EXISTS password_resets (
       id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
       user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       token      TEXT        UNIQUE NOT NULL,
       expires_at TIMESTAMPTZ NOT NULL,
       used_at    TIMESTAMPTZ,
       created_at TIMESTAMPTZ DEFAULT NOW()
     )`,
  ];

  const results = [];
  for (const sql of migrations) {
    try {
      await db.query(sql);
      results.push({ ok: true, sql: sql.trim().slice(0, 60) });
    } catch (err) {
      results.push({ ok: false, sql: sql.trim().slice(0, 60), error: err.message });
    }
  }
  return results;
}

// ─── POST: seed demo users ────────────────────────────────────────────────────
export async function POST(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getDb();

    // 1. Ensure all required columns exist
    const schemaResults = await ensureColumns(db);
    console.log('[SEED] Schema migrations:', schemaResults);

    // 2. Upsert demo users
    const seeded = [];
    for (const u of DEMO_USERS) {
      try {
        const hash = await bcrypt.hash(u.password, 10);

        // UPSERT: insert or update on email conflict
        await db.query(
          `INSERT INTO users (email, password_hash, username, role)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (email) DO UPDATE
             SET password_hash = EXCLUDED.password_hash,
                 username      = EXCLUDED.username,
                 role          = EXCLUDED.role`,
          [u.email, hash, u.username, u.role]
        );

        seeded.push({ email: u.email, role: u.role, status: 'ok' });
        console.log('[SEED] Upserted:', u.email, u.role);
      } catch (err) {
        seeded.push({ email: u.email, role: u.role, status: 'error', error: err.message });
        console.error('[SEED] Failed to upsert', u.email, err.message);
      }
    }

    const failed = seeded.filter((s) => s.status === 'error');
    return Response.json({
      message: failed.length === 0 ? 'All demo users seeded successfully' : 'Some users failed',
      users: seeded,
      schema: schemaResults,
      credentials: DEMO_USERS.map((u) => ({ email: u.email, password: u.password, role: u.role })),
    }, { status: failed.length === 0 ? 200 : 207 });

  } catch (err) {
    console.error('[SEED] Fatal error:', err.message);
    return Response.json({ error: 'Seed failed', details: err.message }, { status: 500 });
  }
}

// ─── GET: list current users ──────────────────────────────────────────────────
export async function GET(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getDb();
    const result = await db.query(
      `SELECT id, email, username, role, created_at, last_seen
       FROM users
       ORDER BY created_at ASC
       LIMIT 100`
    );
    return Response.json({ count: result.rows.length, users: result.rows });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
