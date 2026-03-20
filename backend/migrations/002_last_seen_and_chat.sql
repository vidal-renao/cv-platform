-- Migration 002: Add last_seen to users + create internal chat_messages table
-- Run: psql $DATABASE_URL -f backend/migrations/002_last_seen_and_chat.sql

-- Track when each user was last active
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;

-- Internal staff chat (direct messages between users)
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
