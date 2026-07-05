-- CV Platform — Canonical DB Schema
-- Run once against your PostgreSQL database to initialize all tables.
-- Safe to re-run: all statements use IF NOT EXISTS.

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users
CREATE TABLE IF NOT EXISTS users (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(50)  DEFAULT 'CLIENT',
  name          VARCHAR(255),
  last_seen     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- Clients (tenant-scoped to user_id)
CREATE TABLE IF NOT EXISTS clients (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(255) NOT NULL,
  phone      VARCHAR(50),
  email      VARCHAR(255),
  address    TEXT,
  status     VARCHAR(50)  DEFAULT 'active',
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);

-- Packages (tenant-scoped to user_id)
CREATE TABLE IF NOT EXISTS packages (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id       UUID         NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tracking_number VARCHAR(100) UNIQUE NOT NULL,
  description     TEXT,
  status          VARCHAR(50)  DEFAULT 'ARRIVED',
  created_at      TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_packages_user_id   ON packages(user_id);
CREATE INDEX IF NOT EXISTS idx_packages_client_id ON packages(client_id);

-- Password resets
CREATE TABLE IF NOT EXISTS password_resets (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT        UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_token   ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);

-- Notifications (tenant-scoped to user_id)
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id  UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  package_id UUID        NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  type       VARCHAR(100) NOT NULL,
  status     VARCHAR(50)  DEFAULT 'pending',
  sent_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Internal staff chat
CREATE TABLE IF NOT EXISTS chat_messages (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content      TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  is_read      BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_msg_sender    ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_msg_recipient ON chat_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_chat_msg_thread    ON chat_messages(
  LEAST(sender_id, recipient_id),
  GREATEST(sender_id, recipient_id),
  created_at
);

-- ─── Migration 003 tables ─────────────────────────────────

-- App settings (singleton per tenant)
CREATE TABLE IF NOT EXISTS app_settings (
  id              INTEGER PRIMARY KEY DEFAULT 1,
  tenant_user_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  currency_code   VARCHAR(3) NOT NULL DEFAULT 'CHF',
  currency_symbol VARCHAR(8) NOT NULL DEFAULT 'CHF',
  cost_per_kg     NUMERIC(10, 2) NOT NULL DEFAULT 0,
  settings        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT app_settings_singleton_or_tenant CHECK (id = 1 OR tenant_user_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_app_settings_tenant_user_id ON app_settings(tenant_user_id);

-- Package comments
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

-- Delivery proofs
CREATE TABLE IF NOT EXISTS delivery_proofs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id     UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  user_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  client_id      UUID REFERENCES clients(id) ON DELETE SET NULL,
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

-- Password reset extensions (from migration 003)
ALTER TABLE password_resets
  ADD COLUMN IF NOT EXISTS purpose VARCHAR(30) NOT NULL DEFAULT 'password_reset',
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_password_resets_purpose ON password_resets(purpose);
