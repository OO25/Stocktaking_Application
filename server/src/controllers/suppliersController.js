import pool from "../config/db.js";

/**
 * GET /api/suppliers
 * Returns all suppliers ordered by name.
 */
export async function getSuppliers(_req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT id, name, contact_name, email, NULL::text AS website FROM suppliers ORDER BY name"
    );
    res.json(rows);
  } catch (err) {
    console.error("getSuppliers error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch suppliers." });
  }
}
