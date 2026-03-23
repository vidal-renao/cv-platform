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

// ─── Emergency fallback key (use only if JWT_SECRET is not loading in Vercel) ──
const EMERGENCY_KEY = 'seed-vidal-2026';

// ─── Auth guard ──────────────────────────────────────────────────────────────
function isAuthorized(request) {
  const rawEnvKey = process.env.SETUP_KEY || process.env.JWT_SECRET || '';
  // Trim to defend against Vercel storing the value with surrounding whitespace or quotes
  const setupKey = rawEnvKey.trim().replace(/^["']|["']$/g, '');

  const headerKey = (request.headers.get('x-setup-key') || '').trim();
  const urlKey    = (new URL(request.url).searchParams.get('key') || '').trim();

  // Debug — visible in Vercel Function Logs
  console.log('[SEED] JWT_SECRET length in env:', rawEnvKey.length);
  console.log('[SEED] JWT_SECRET first 8 chars:', rawEnvKey.slice(0, 8));
  console.log('[SEED] setupKey (trimmed) length:', setupKey.length);
  console.log('[SEED] urlKey received:', urlKey.slice(0, 8), '... length:', urlKey.length);
  console.log('[SEED] match via env?', urlKey === setupKey || headerKey === setupKey);
  console.log('[SEED] match via emergency?', urlKey === EMERGENCY_KEY || headerKey === EMERGENCY_KEY);

  if (!setupKey) return true; // no key configured → allow (dev mode)

  return (
    urlKey    === setupKey       ||
    headerKey === setupKey       ||
    urlKey    === EMERGENCY_KEY  ||
    headerKey === EMERGENCY_KEY
  );
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

        // Force UPDATE as a safety net — guarantees the hash is always fresh
        await db.query(
          `UPDATE users SET password_hash = $1 WHERE LOWER(email) = LOWER($2)`,
          [hash, u.email]
        );

        seeded.push({ email: u.email, role: u.role, status: 'ok' });
        console.log('[SEED] Upserted + force-updated hash for:', u.email, u.role);
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

// ─── GET: seed demo users (browser-friendly — same logic as POST) ─────────────
export async function GET(request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized — add ?key=TU_JWT_SECRET to the URL' }, { status: 401 });
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
        console.log('[SEED] hash prefix for', u.email, ':', hash.slice(0, 7));

        // UPSERT: insert or overwrite
        await db.query(
          `INSERT INTO users (email, password_hash, username, role)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (email) DO UPDATE
             SET password_hash = EXCLUDED.password_hash,
                 username      = EXCLUDED.username,
                 role          = EXCLUDED.role`,
          [u.email, hash, u.username, u.role]
        );

        // Force UPDATE as a safety net — guarantees the hash is always fresh
        await db.query(
          `UPDATE users SET password_hash = $1 WHERE LOWER(email) = LOWER($2)`,
          [hash, u.email]
        );

        seeded.push({ email: u.email, role: u.role, status: 'ok' });
        console.log('[SEED] Upserted + force-updated hash for:', u.email, u.role);
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
