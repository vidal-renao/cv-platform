-- ============================================================
-- Migration: Fix packages table to match canonical schema
-- Run once against your local and production PostgreSQL DB.
-- Safe to re-run: all operations use IF EXISTS / IF NOT EXISTS.
-- ============================================================

BEGIN;

-- 1. Ensure the canonical primary key column exists
--    (in case the DB was created with 'package_id' as PK instead of 'id')
ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

-- 2. Populate 'id' for any rows where it is NULL
--    (only relevant if 'id' was just added)
UPDATE packages SET id = gen_random_uuid() WHERE id IS NULL;

-- 3. Promote 'id' to primary key if it is not already one
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'packages'
      AND constraint_type = 'PRIMARY KEY'
      AND constraint_name = 'packages_pkey'
  ) THEN
    ALTER TABLE packages ADD PRIMARY KEY (id);
  END IF;
END $$;

-- 4. Drop the stray 'package_id' column if it exists
ALTER TABLE packages DROP COLUMN IF EXISTS package_id;

-- 5. Ensure all other canonical columns exist with correct types
ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS user_id    UUID         NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  ADD COLUMN IF NOT EXISTS client_id  UUID         NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS status     VARCHAR(50)  DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ  DEFAULT NOW();

-- 6. Ensure tracking_number has its UNIQUE constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'packages'
      AND constraint_type = 'UNIQUE'
      AND constraint_name = 'packages_tracking_number_key'
  ) THEN
    ALTER TABLE packages ADD CONSTRAINT packages_tracking_number_key UNIQUE (tracking_number);
  END IF;
END $$;

-- 7. Recreate indexes (IF NOT EXISTS is supported in PG 9.5+)
CREATE INDEX IF NOT EXISTS idx_packages_user_id   ON packages(user_id);
CREATE INDEX IF NOT EXISTS idx_packages_client_id ON packages(client_id);

COMMIT;

-- ── Verification query — run this after the migration ────────────────────────
-- Expected: id, user_id, client_id, tracking_number, description, status, created_at
-- Expected: NO package_id column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'packages'
ORDER BY ordinal_position;
