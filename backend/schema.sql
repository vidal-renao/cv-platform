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
