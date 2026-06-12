-- Migration 003: Support restored Next API routes without runtime schema mutations.
-- Run: psql $DATABASE_URL -f backend/migrations/003_api_hardening_support_tables.sql

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS app_settings (
  id              INTEGER PRIMARY KEY DEFAULT 1,
  tenant_user_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  currency_code   VARCHAR(3) NOT NULL DEFAULT 'CHF',
  currency_symbol VARCHAR(8) NOT NULL DEFAULT 'CHF',
  cost_per_kg     NUMERIC(10, 2) NOT NULL DEFAULT 0,
  settings         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT app_settings_singleton_or_tenant CHECK (id = 1 OR tenant_user_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_app_settings_tenant_user_id ON app_settings(tenant_user_id);

INSERT INTO app_settings (id, currency_code, currency_symbol, cost_per_kg)
VALUES (1, 'CHF', 'CHF', 0)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS package_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id  UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
  comment     TEXT NOT NULL CHECK (char_length(trim(comment)) BETWEEN 1 AND 5000),
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,
  visibility  VARCHAR(20) NOT NULL DEFAULT 'client',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT package_comments_visibility_check CHECK (visibility IN ('internal', 'client', 'public'))
);

CREATE INDEX IF NOT EXISTS idx_package_comments_package_id ON package_comments(package_id, created_at);
CREATE INDEX IF NOT EXISTS idx_package_comments_user_id ON package_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_package_comments_client_id ON package_comments(client_id);

CREATE TABLE IF NOT EXISTS delivery_proofs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id  UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  client_id   UUID REFERENCES clients(id) ON DELETE SET NULL,
  signature_data TEXT,
  photo_data     TEXT,
  file_url       TEXT,
  file_name      TEXT,
  mime_type      TEXT,
  size_bytes     BIGINT,
  notes          TEXT,
  status         VARCHAR(30) NOT NULL DEFAULT 'submitted',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT delivery_proofs_status_check CHECK (status IN ('submitted', 'accepted', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_delivery_proofs_package_id ON delivery_proofs(package_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_proofs_user_id ON delivery_proofs(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_proofs_client_id ON delivery_proofs(client_id);

ALTER TABLE password_resets
  ADD COLUMN IF NOT EXISTS purpose VARCHAR(30) NOT NULL DEFAULT 'password_reset',
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_password_resets_purpose ON password_resets(purpose);

COMMIT;
