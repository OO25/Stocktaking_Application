import pool from "../config/db.js";

/**
 * GET /api/uom
 * Returns all units of measure ordered by name.
 */
export async function getUoms(_req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, description, created_at, updated_at
       FROM units_of_measure
       ORDER BY name`
    );
    res.json(rows);
  } catch (err) {
    console.error("getUoms error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch units." });
  }
}
