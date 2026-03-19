import pool from "../config/db.js";

/**
 * GET /api/products?page=1&limit=10&search=&category=
 * Returns a paginated list of products joined with their category and supplier.
 * Supports text search (name, supplier, product_code) and exact category filtering.
 */
export async function getProducts(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const search = (req.query.search ?? "").trim();
    const offset = (page - 1) * limit;

    // Build optional WHERE clause for search
    const conditions = [];
    const params = [];

    if (search) {
      const pattern = `%${search}%`;
      params.push(pattern);
      const idx = params.length;
      conditions.push(`(
        p.name         ILIKE $${idx} OR
        s.name         ILIKE $${idx} OR
        p.product_code ILIKE $${idx}
      )`);
    }

    const category = (req.query.category ?? "").trim();
    if (category) {
      params.push(category);
      const idx = params.length;
      conditions.push(`(fg.name = $${idx} OR pt.name = $${idx})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const baseFrom = `
      FROM products p
      LEFT JOIN food_groups      fg  ON fg.id  = p.food_group_id
      LEFT JOIN packaging_types  pt  ON pt.id  = p.packaging_type_id
      LEFT JOIN suppliers         s  ON s.id   = p.supplier_id
      LEFT JOIN units_of_measure  u  ON u.id   = p.uom_id
      ${whereClause}
    `;

    // Run count + paginated select in parallel
    const countQuery = pool.query(
      `SELECT COUNT(*) AS total ${baseFrom}`,
      params
    );

    const rowsQuery = pool.query(
      `SELECT
        p.id,
        p.name,
        p.is_packaging,
        p.uom_id,
        u.name   AS uom,
        p.product_code,
        p.unit_size,
        p.package_size,
        p.price,
        p.last_price_check,
        p.created_at,
        fg.name  AS food_group,
        pt.name  AS packaging_type,
        s.name   AS supplier
      ${baseFrom}
      ORDER BY p.name
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const [countResult, rowsResult] = await Promise.all([countQuery, rowsQuery]);

    res.json({
      rows: rowsResult.rows,
      totalCount: parseInt(countResult.rows[0].total, 10),
    });
  } catch (err) {
    console.error("getProducts error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch products." });
  }
}

/**
 * POST /api/products
 * Creates a new product. Returns the newly created row.
 */
export async function createProduct(req, res) {
  try {
    const {
      name,
      is_packaging = false,
      food_group_id,
      packaging_type_id,
      supplier_id,
      price = 0,
      uom_id,
      product_code,
      unit_size,
      package_size,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Product name is required." });
    }

    const { rows } = await pool.query(
      `INSERT INTO products
        (name, is_packaging, food_group_id, packaging_type_id, supplier_id, price, uom_id, product_code, unit_size, package_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        name.trim(),
        is_packaging,
        is_packaging ? null : (food_group_id || null),
        is_packaging ? (packaging_type_id || null) : null,
        supplier_id || null,
        price,
        uom_id || null,
        product_code || null,
        unit_size || null,
        package_size || null,
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("createProduct error:", err);
    res.status(500).json({ error: err.message || "Failed to create product." });
  }
}
