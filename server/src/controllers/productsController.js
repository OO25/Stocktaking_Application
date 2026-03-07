import pool from "../config/db.js";

/**
 * GET /api/products
 * Returns all products joined with their category (food_group or packaging_type) and supplier.
 */
export async function getProducts(_req, res) {
  try {
    const { rows } = await pool.query(`
      SELECT
        p.id,
        p.name,
        p.is_packaging,
        p.uom,
        p.product_code,
        p.unit_size,
        p.package_size,
        p.price,
        p.last_price_check,
        p.created_at,
        fg.name  AS food_group,
        pt.name  AS packaging_type,
        s.name   AS supplier
      FROM products p
      LEFT JOIN food_groups     fg ON fg.id = p.food_group_id
      LEFT JOIN packaging_types pt ON pt.id = p.packaging_type_id
      LEFT JOIN suppliers        s ON s.id  = p.supplier_id
      ORDER BY p.name
    `);

    res.json(rows);
  } catch (err) {
    console.error("getProducts error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch products." });
  }
}
