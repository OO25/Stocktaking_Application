import pool from "../config/db.js";

/**
 * GET /api/categories
 * Returns all food groups and packaging types as a single list.
 */
export async function getCategories(_req, res) {
  try {
    const [foodGroups, packagingTypes] = await Promise.all([
      pool.query("SELECT id, name FROM food_groups ORDER BY sort_order"),
      pool.query("SELECT id, name FROM packaging_types ORDER BY sort_order"),
    ]);

    res.json({
      foodGroups: foodGroups.rows,
      packagingTypes: packagingTypes.rows,
    });
  } catch (err) {
    console.error("getCategories error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch categories." });
  }
}
