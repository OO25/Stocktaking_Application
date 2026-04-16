import pool from "../config/db.js";

/**
 * GET /api/products?page=1&limit=10&search=
 * Returns a paginated list of products with their outlet IDs and names.
 */
export async function getProducts(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 10),
    );
    const search = (req.query.search ?? "").trim();
    const type = (req.query.type ?? "").trim();
    const category = (req.query.category ?? "").trim();
    const supplier = (req.query.supplier ?? "").trim();
    const outlet = (req.query.outlet ?? "").trim();
    const sort = (req.query.sort ?? "az").trim();
    const offset = (page - 1) * limit;

    const conditions = [];
    const params = [];

    if (type === "food") {
      conditions.push("p.is_packaging = false");
    } else if (type === "packaging") {
      conditions.push("p.is_packaging = true");
    }

    if (search) {
      const idxWildcard = params.length + 1;
      const idxPlain = params.length + 2;
      params.push(`%${search}%`, search);

      // Treat barcodes as text so alphanumeric values are supported.
      conditions.push(`(
        p.barcode       = $${idxPlain} OR
        p.name          ILIKE $${idxWildcard} OR
        s.name          ILIKE $${idxWildcard} OR
        p.barcode       ILIKE $${idxWildcard} OR
        similarity(p.name, $${idxPlain}) > 0.2 OR
        similarity(s.name, $${idxPlain}) > 0.2 OR
        similarity(p.barcode, $${idxPlain}) > 0.2
      )`);
    }

    if (category) {
      const idx = params.length + 1;
      params.push(category);
      conditions.push(`(
        (p.is_packaging = true AND pt.name = $${idx}) OR
        (p.is_packaging = false AND fg.name = $${idx})
      )`);
    }

    if (supplier) {
      const idx = params.length + 1;
      params.push(supplier);
      conditions.push(`s.name = $${idx}`);
    }

    if (outlet) {
      const idx = params.length + 1;
      params.push(outlet);
      conditions.push(`o.name = $${idx}`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const orderBy = (() => {
      switch (sort) {
        case "newest":
          return "p.created_at DESC, p.id DESC";
        case "price_asc":
          return "p.price ASC NULLS LAST, p.name ASC, p.id ASC";
        case "price_desc":
          return "p.price DESC NULLS LAST, p.name ASC, p.id ASC";
        case "az":
        default:
          return "LOWER(p.name) ASC NULLS LAST, p.name ASC, p.id ASC";
      }
    })();

    // Outlet joins are inside baseFrom so they work with the WHERE clause and COUNT query
    const baseFrom = `
      FROM products p
      LEFT JOIN food_groups      fg  ON fg.id  = p.food_group_id
      LEFT JOIN packaging_types  pt  ON pt.id  = p.packaging_type_id
      LEFT JOIN suppliers         s  ON s.id   = p.supplier_id
      LEFT JOIN units_of_measure  u  ON u.id   = p.uom_id
      LEFT JOIN outlet_products  op  ON op.product_id = p.id
      LEFT JOIN outlets           o  ON o.id   = op.outlet_id
      ${whereClause}
    `;

    const countQuery = pool.query(
      `SELECT COUNT(DISTINCT p.id) AS total ${baseFrom}`,
      params,
    );

    const rowsQuery = pool.query(
      `SELECT
        p.id,
        p.name,
        p.is_packaging,
        p.uom_id,
        u.name   AS uom,
        p.barcode AS product_code,
        p.unit_size,
        p.package_size,
        p.price,
        p.food_group_id,
        p.packaging_type_id,
        p.supplier_id,
        p.last_price_check,
        p.created_at,
        fg.name  AS food_group,
        pt.name  AS packaging_type,
        s.name   AS supplier,
        COALESCE(
          ARRAY_AGG(op.outlet_id) FILTER (WHERE op.outlet_id IS NOT NULL),
          '{}'::int[]
        ) AS outlet_ids,
        COALESCE(
          ARRAY_AGG(o.name ORDER BY o.name) FILTER (WHERE o.name IS NOT NULL),
          '{}'::text[]
        ) AS outlet_names
      ${baseFrom}
      GROUP BY p.id, p.name, p.is_packaging, p.uom_id, p.barcode, p.unit_size, p.package_size, p.price, p.food_group_id, p.packaging_type_id, p.supplier_id, p.last_price_check, p.created_at, u.name, fg.name, pt.name, s.name
      ORDER BY ${orderBy}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );

    const [countResult, rowsResult] = await Promise.all([
      countQuery,
      rowsQuery,
    ]);

    res.json({
      rows: rowsResult.rows,
      totalCount: parseInt(countResult.rows[0].total, 10),
    });
  } catch (err) {
    console.error("getProducts error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch products." });
  }
}

// ¯\_(ツ)_/¯  it works on mine

/**
 * POST /api/products
 * Creates a new product and saves outlet links.
 */
export async function createProduct(req, res) {
  const client = await pool.connect();
  try {
    const {
      name,
      is_packaging = false,
      food_group_id,
      packaging_type_id,
      supplier_id,
      price = 0,
      uom_id,
      barcode,
      product_code,
      unit_size,
      package_size,
      outlet_ids = [],
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Product name is required." });
    }

    await client.query("BEGIN");

    const { rows } = await client.query(
      `INSERT INTO products
        (name, is_packaging, food_group_id, packaging_type_id, supplier_id, price, uom_id, barcode, unit_size, package_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, name, is_packaging, food_group_id, packaging_type_id, supplier_id, price, uom_id, barcode AS product_code, unit_size, package_size, last_price_check, created_at`,
      [
        name.trim(),
        is_packaging,
        is_packaging ? null : food_group_id || null,
        is_packaging ? packaging_type_id || null : null,
        supplier_id || null,
        price,
        uom_id || null,
        barcode ?? product_code ?? null,
        unit_size || null,
        package_size || null,
      ],
    );

    const newProduct = rows[0];

    // Save outlet links
    const outletIds = Array.isArray(outlet_ids)
      ? outlet_ids.map(Number).filter((id) => Number.isInteger(id) && id > 0)
      : [];

    if (outletIds.length > 0) {
      await client.query(
        `INSERT INTO outlet_products (product_id, outlet_id)
         SELECT $1, UNNEST($2::int[])`,
        [newProduct.id, outletIds],
      );
    }

    await client.query("COMMIT");
    res.status(201).json(newProduct);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("createProduct error:", err);
    res.status(500).json({ error: err.message || "Failed to create product." });
  } finally {
    client.release();
  }
}

/**
 * PUT /api/products/:id
 * Updates an existing product and replaces outlet links.
 */
export async function updateProduct(req, res) {
  const client = await pool.connect();
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid product id." });
    }

    const {
      name,
      is_packaging = false,
      food_group_id,
      packaging_type_id,
      supplier_id,
      price = 0,
      uom_id,
      barcode,
      product_code,
      unit_size,
      package_size,
      outlet_ids = [],
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Product name is required." });
    }

    await client.query("BEGIN");

    const { rows } = await client.query(
      `UPDATE products
       SET name               = $1,
           is_packaging       = $2,
           food_group_id      = $3,
           packaging_type_id  = $4,
           supplier_id        = $5,
           price              = $6,
           uom_id             = $7,
           barcode            = $8,
           unit_size          = $9,
           package_size       = $10
       WHERE id = $11
       RETURNING id, name, is_packaging, food_group_id, packaging_type_id, supplier_id, price, uom_id, barcode AS product_code, unit_size, package_size, last_price_check, created_at`,
      [
        name.trim(),
        is_packaging,
        is_packaging ? null : food_group_id || null,
        is_packaging ? packaging_type_id || null : null,
        supplier_id || null,
        price,
        uom_id || null,
        barcode ?? product_code ?? null,
        unit_size || null,
        package_size || null,
        id,
      ],
    );

    if (!rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Product not found." });
    }

    // Replace outlet links — delete existing then insert new
    await client.query("DELETE FROM outlet_products WHERE product_id = $1", [
      id,
    ]);

    const outletIds = Array.isArray(outlet_ids)
      ? outlet_ids.map(Number).filter((oid) => Number.isInteger(oid) && oid > 0)
      : [];

    if (outletIds.length > 0) {
      await client.query(
        `INSERT INTO outlet_products (product_id, outlet_id)
         SELECT $1, UNNEST($2::int[])`,
        [id, outletIds],
      );
    }

    await client.query("COMMIT");
    res.json(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("updateProduct error:", err);
    res.status(500).json({ error: err.message || "Failed to update product." });
  } finally {
    client.release();
  }
}

// ¯\_(ツ)_/¯  it's not a bug, it's a feature shhhhhhhh

/**
 * DELETE /api/products/:id
 * Deletes a product and its outlet links.
 */
export async function deleteProduct(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid product id." });
    }

    // Delete outlet links first in case there is no cascade on the foreign key
    await pool.query("DELETE FROM outlet_products WHERE product_id = $1", [id]);

    const { rows } = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING id",
      [id],
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Product not found." });
    }

    res.json({ success: true });
  } catch (err) {
    if (err?.code === "23503") {
      return res.status(400).json({
        error:
          "This product cannot be deleted because it has stocktake entries.",
      });
    }
    console.error("deleteProduct error:", err);
    res.status(500).json({ error: err.message || "Failed to delete product." });
  }
}
