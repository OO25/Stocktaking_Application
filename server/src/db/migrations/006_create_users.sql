-- Migration 006: Create users table
-- Roles: admin = full access, manager = operational access

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL       PRIMARY KEY,
  username      VARCHAR(100) NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  role          VARCHAR(50)  NOT NULL DEFAULT 'manager'
                             CHECK (role IN ('admin', 'manager')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Case-insensitive index for fast username lookups
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx
  ON users (LOWER(username));
