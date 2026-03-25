import pool from "../config/db.js";

/**
 * GET /api/categories?search=
 * Returns all food groups and packaging types as two separate arrays.
 * Supports optional fuzzy text search.
 */
export async function getCategories(req, res) {
  try {
    const search = (req.query.search ?? "").trim();

    const conditions = [];
    const params = [];

    if (search) {
      params.push(search);
      const idx = params.length;
      conditions.push(`name ILIKE $${idx} OR similarity(name, $${idx}) > 0.2`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [foodGroups, packagingTypes] = await Promise.all([
      pool.query(
        `SELECT id, name FROM food_groups ${where} ORDER BY sort_order`,
        params
      ),
      pool.query(
        `SELECT id, name FROM packaging_types ${where} ORDER BY sort_order`,
        params
      ),
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
