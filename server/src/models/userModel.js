// DB helpers for the users table

import pool from "../config/db.js";

// Find a user by username (case-insensitive). Returns null if not found
export async function findByUsername(username) {
  const result = await pool.query(
    "SELECT * FROM users WHERE LOWER(username) = LOWER($1)",
    [username],
  );

  return result.rows[0] ?? null;
}

// Insert a new user. Password must already be hashed before calling this
export async function createUser(username, passwordHash, role) {
  const result = await pool.query(
    `INSERT INTO users (username, password_hash, role)
     VALUES ($1, $2, $3)
     RETURNING id, username, role, created_at`,
    [username, passwordHash, role],
  );

  return result.rows[0];
}
