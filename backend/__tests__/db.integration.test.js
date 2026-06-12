const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const databaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
const runIntegration = process.env.RUN_DB_INTEGRATION === '1' || Boolean(process.env.TEST_DATABASE_URL);
const describeIntegration = runIntegration ? describe : describe.skip;

function hashPublicToken(token) {
  return crypto.createHash('sha256').update(token, 'utf8').digest('hex');
}

describeIntegration('database migration 003 integration', () => {
  let db;
  const ids = {
    tenantA: crypto.randomUUID(),
    tenantB: crypto.randomUUID(),
    clientA: crypto.randomUUID(),
    clientB: crypto.randomUUID(),
    packageA: crypto.randomUUID(),
    packageB: crypto.randomUUID(),
  };

  beforeAll(async () => {
    if (!databaseUrl) {
      throw new Error('TEST_DATABASE_URL or DATABASE_URL is required for DB integration tests');
    }

    db = new Client({ connectionString: databaseUrl });
    await db.connect();

    const migration = fs.readFileSync(
      path.join(__dirname, '..', 'migrations', '003_api_hardening_support_tables.sql'),
      'utf8'
    );
    await db.query(migration);

    await db.query(
      `INSERT INTO users (id, email, password_hash, role, name)
       VALUES ($1, 'tenant-a@example.com', 'hash', 'ADMIN', 'Tenant A'),
              ($2, 'tenant-b@example.com', 'hash', 'ADMIN', 'Tenant B')
       ON CONFLICT (id) DO NOTHING`,
      [ids.tenantA, ids.tenantB]
    );

    await db.query(
      `INSERT INTO clients (id, user_id, name, email, status)
       VALUES ($1, $2, 'Client A', 'client-a@example.com', 'active'),
              ($3, $4, 'Client B', 'client-b@example.com', 'active')
       ON CONFLICT (id) DO NOTHING`,
      [ids.clientA, ids.tenantA, ids.clientB, ids.tenantB]
    );

    await db.query(
      `INSERT INTO packages (id, user_id, client_id, tracking_number, description, status)
       VALUES ($1, $2, $3, 'TEST-A-003', 'Tenant A package', 'ARRIVED'),
              ($4, $5, $6, 'TEST-B-003', 'Tenant B package', 'ARRIVED')
       ON CONFLICT (tracking_number) DO NOTHING`,
      [ids.packageA, ids.tenantA, ids.clientA, ids.packageB, ids.tenantB, ids.clientB]
    );
  });

  afterAll(async () => {
    if (!db) return;

    await db.query('DELETE FROM delivery_proofs WHERE package_id IN ($1, $2)', [ids.packageA, ids.packageB]);
    await db.query('DELETE FROM package_comments WHERE package_id IN ($1, $2)', [ids.packageA, ids.packageB]);
    await db.query('DELETE FROM packages WHERE id IN ($1, $2)', [ids.packageA, ids.packageB]);
    await db.query('DELETE FROM clients WHERE id IN ($1, $2)', [ids.clientA, ids.clientB]);
    await db.query('DELETE FROM password_resets WHERE user_id IN ($1, $2)', [ids.tenantA, ids.tenantB]);
    await db.query('DELETE FROM users WHERE id IN ($1, $2)', [ids.tenantA, ids.tenantB]);
    await db.end();
  });

  test('migration 003 objects exist', async () => {
    const result = await db.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name IN ('app_settings', 'package_comments', 'delivery_proofs')`
    );

    expect(result.rows.map((row) => row.table_name).sort()).toEqual([
      'app_settings',
      'delivery_proofs',
      'package_comments',
    ]);
  });

  test('password reset stores hashed one-time access token with purpose', async () => {
    const publicToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashPublicToken(publicToken);

    await db.query(
      `INSERT INTO password_resets (user_id, token, expires_at, purpose, created_by_user_id)
       VALUES ($1, $2, NOW() + INTERVAL '1 hour', 'client_access', $1)`,
      [ids.tenantA, tokenHash]
    );

    const result = await db.query(
      `SELECT token, purpose, expires_at > NOW() AS is_unexpired
       FROM password_resets
       WHERE user_id = $1 AND purpose = 'client_access'
       ORDER BY created_at DESC
       LIMIT 1`,
      [ids.tenantA]
    );

    expect(result.rows[0]).toMatchObject({
      token: tokenHash,
      purpose: 'client_access',
      is_unexpired: true,
    });
    expect(result.rows[0].token).not.toBe(publicToken);
  });

  test('settings can be read and updated', async () => {
    await db.query(
      `UPDATE app_settings
       SET currency_code = 'CHF', currency_symbol = 'CHF', cost_per_kg = 12.50, updated_at = NOW()
       WHERE id = 1`
    );

    const result = await db.query('SELECT currency_code, currency_symbol, cost_per_kg FROM app_settings WHERE id = 1');

    expect(result.rows[0].currency_code).toBe('CHF');
    expect(result.rows[0].currency_symbol).toBe('CHF');
    expect(Number(result.rows[0].cost_per_kg)).toBe(12.5);
  });

  test('comments and proofs are associated to the correct package', async () => {
    await db.query(
      `INSERT INTO package_comments (package_id, user_id, comment, is_internal, visibility)
       VALUES ($1, $2, 'integration comment', false, 'client')`,
      [ids.packageA, ids.tenantA]
    );

    await db.query(
      `INSERT INTO delivery_proofs (package_id, user_id, signature_data, notes)
       VALUES ($1, $2, 'signature-data', 'integration proof')`,
      [ids.packageA, ids.tenantA]
    );

    const comments = await db.query('SELECT comment FROM package_comments WHERE package_id = $1', [ids.packageA]);
    const proofs = await db.query('SELECT notes FROM delivery_proofs WHERE package_id = $1', [ids.packageA]);

    expect(comments.rows).toHaveLength(1);
    expect(proofs.rows).toHaveLength(1);
  });

  test('tenant-scoped package query does not leak another tenant package', async () => {
    const tenantAResult = await db.query(
      'SELECT id, user_id FROM packages WHERE user_id = $1 ORDER BY tracking_number',
      [ids.tenantA]
    );

    expect(tenantAResult.rows.map((row) => row.id)).toContain(ids.packageA);
    expect(tenantAResult.rows.map((row) => row.id)).not.toContain(ids.packageB);
  });
});
