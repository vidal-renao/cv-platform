-- ============================================================
-- Migration 004: Critical schema fixes
-- Adds missing columns, tables, and constraints.
-- Safe to re-run: all operations use IF NOT EXISTS.
-- ============================================================

BEGIN;

-- 1. Add weight and cost columns to packages
ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS weight NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS cost   NUMERIC(10, 2);

-- 2. Fix default status in fix_packages migration (should be ARRIVED, not pending)
ALTER TABLE packages ALTER COLUMN status SET DEFAULT 'ARRIVED';
UPDATE packages SET status = 'ARRIVED' WHERE status = 'pending';

-- 3. Create pricing_config table
CREATE TABLE IF NOT EXISTS pricing_config (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  min_weight NUMERIC(10, 2) NOT NULL,
  max_weight NUMERIC(10, 2) NOT NULL,
  price      NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT pricing_config_valid_range CHECK (min_weight < max_weight)
);

-- 4. Add UNIQUE constraint on delivery_proofs.package_id (needed for ON CONFLICT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'delivery_proofs'
      AND constraint_type = 'UNIQUE'
      AND constraint_name = 'delivery_proofs_package_id_key'
  ) THEN
    ALTER TABLE delivery_proofs ADD CONSTRAINT delivery_proofs_package_id_key UNIQUE (package_id);
  END IF;
END $$;

-- 5. Insert default pricing tiers (CHF per kg)
INSERT INTO pricing_config (min_weight, max_weight, price) VALUES
  (0, 1, 15.00),
  (1, 5, 12.00),
  (5, 15, 9.00),
  (15, 30, 7.00),
  (30, 9999, 5.00)
ON CONFLICT DO NOTHING;

-- 6. Create audit_logs table (INSERT-only, immutable)
CREATE TABLE IF NOT EXISTS audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  action     VARCHAR(100) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id  UUID,
  old_data   JSONB,
  new_data   JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name, created_at);

COMMIT;
