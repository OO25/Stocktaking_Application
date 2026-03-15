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
export async function createUser(name, username, passwordHash, role) {
  const result = await pool.query(
    `INSERT INTO users (name, username, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, username, role, created_at`,
    [name, username, passwordHash, role],
  );

  return result.rows[0];
}
