-- CV Platform — Canonical DB Schema
-- Run once against your PostgreSQL database to initialize all tables.
-- Safe to re-run: all statements use IF NOT EXISTS.

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Clients (tenant-scoped to user_id)
CREATE TABLE IF NOT EXISTS clients (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(255) NOT NULL,
  phone      VARCHAR(50),
  email      VARCHAR(255),
  address    TEXT,
  status     VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);

-- Packages (tenant-scoped to user_id)
CREATE TABLE IF NOT EXISTS packages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id       UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tracking_number VARCHAR(100) UNIQUE NOT NULL,
  description     TEXT,
  status          VARCHAR(50) DEFAULT 'pending',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_packages_user_id   ON packages(user_id);
CREATE INDEX IF NOT EXISTS idx_packages_client_id ON packages(client_id);

-- Notifications (tenant-scoped to user_id)
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id  UUID        NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  package_id UUID        NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  type       VARCHAR(100) NOT NULL,
  status     VARCHAR(50) DEFAULT 'pending',
  sent_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Add status column to clients if upgrading from an older schema
ALTER TABLE clients ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
