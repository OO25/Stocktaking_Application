import pool from "../config/db.js";

/**
 * GET /api/users
 * Returns all users ordered by name.
 */
export async function getUsers(_req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, username, password_hash, role, created_at, updated_at
       FROM users
       ORDER BY name`
    );
    res.json(rows);
  } catch (err) {
    console.error("getUsers error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch users." });
  }
}
