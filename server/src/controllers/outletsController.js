import pool from "../config/db.js";

/**
 * GET /api/outlets
 * Returns all outlets ordered by name.
 */
export async function getOutlets(_req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT id, name FROM outlets ORDER BY name"
    );
    res.json(rows);
  } catch (err) {
    console.error("getOutlets error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch outlets." });
  }
}
