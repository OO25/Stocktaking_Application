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

// Update a user. If passwordHash is null, keep the existing hash.
export async function updateUser(id, name, username, role, passwordHash) {
  const result = await pool.query(
    `UPDATE users
     SET name = $1,
         username = $2,
         role = $3,
         password_hash = COALESCE($4, password_hash),
         updated_at = now()
     WHERE id = $5
     RETURNING id, name, username, role, created_at, updated_at`,
    [name, username, role, passwordHash, id],
  );

  return result.rows[0] ?? null;
}
