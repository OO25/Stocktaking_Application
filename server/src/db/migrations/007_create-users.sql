-- Migration 007: Create users table
-- Roles: admin = full access, manager = operational access

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL       PRIMARY KEY,
  name          VARCHAR(200),
  username      VARCHAR(100) NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  role          VARCHAR(50)  NOT NULL DEFAULT 'viewer'
                             CHECK (role IN ('admin', 'manager', 'viewer')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- Case-insensitive index for fast username lookups
CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx
  ON users (LOWER(username));

-- Outlet assignments for users
CREATE TABLE IF NOT EXISTS user_outlets (
  user_id   INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  outlet_id INT NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, outlet_id)
);
