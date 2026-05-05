import pool from "../config/db.js";

/**
 * GET /api/categories?search=
 * Returns all food groups and packaging types as two separate arrays.
 * Supports optional fuzzy text search.
 */
export async function getCategories(req, res) {
  try {
    const search = (req.query.search ?? "").trim();

    const foodConditions = [];
    const packagingConditions = [];
    const params = [];

    if (search) {
      params.push(search);
      const idx = params.length;
      foodConditions.push(
        `(fg.name ILIKE $${idx} OR similarity(fg.name, $${idx}) > 0.2)`
      );
      packagingConditions.push(
        `(pt.name ILIKE $${idx} OR similarity(pt.name, $${idx}) > 0.2)`
      );
    }

    const foodWhere = foodConditions.length
      ? `WHERE ${foodConditions.join(" AND ")}`
      : "";
    const packagingWhere = packagingConditions.length
      ? `WHERE ${packagingConditions.join(" AND ")}`
      : "";

    const [foodGroups, packagingTypes] = await Promise.all([
      pool.query(
        `SELECT
           fg.id,
           fg.code,
           fg.name,
           fg.parent_id,
           fg.sort_order,
           fg.created_at,
           fg.updated_at,
           COUNT(p.id)::int AS allocated_product_count
         FROM food_groups fg
         LEFT JOIN products p ON p.food_group_id = fg.id
         ${foodWhere}
         GROUP BY fg.id, fg.code, fg.name, fg.parent_id, fg.sort_order, fg.created_at, fg.updated_at
         ORDER BY fg.sort_order`,
        params
      ),
      pool.query(
        `SELECT
           pt.id,
           pt.name,
           pt.sort_order,
           pt.created_at,
           pt.updated_at,
           COUNT(p.id)::int AS allocated_product_count
         FROM packaging_types pt
         LEFT JOIN products p ON p.packaging_type_id = pt.id
         ${packagingWhere}
         GROUP BY pt.id, pt.name, pt.sort_order, pt.created_at, pt.updated_at
         ORDER BY pt.sort_order`,
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

/**
 * POST /api/categories
 * Creates a new food group or packaging type.
 */
export async function createCategory(req, res) {
  try {
    const { type, code, name, parent_id, sort_order = 0 } = req.body;

    if (!type || !name || !name.trim()) {
      return res.status(400).json({ error: "type and name are required." });
    }

    if (type === "food_group") {
      const { rows } = await pool.query(
        `INSERT INTO food_groups (code, name, parent_id, sort_order)
         VALUES ($1, $2, $3, $4)
         RETURNING id, code, name, parent_id, sort_order, created_at, updated_at`,
        [code || null, name.trim(), parent_id || null, sort_order]
      );

      return res.status(201).json(rows[0]);
    }

    if (type === "packaging_type") {
      const { rows } = await pool.query(
        `INSERT INTO packaging_types (name, sort_order)
         VALUES ($1, $2)
         RETURNING id, name, sort_order, created_at, updated_at`,
        [name.trim(), sort_order]
      );

      return res.status(201).json(rows[0]);
    }

    return res.status(400).json({ error: "Invalid type. Use food_group or packaging_type." });
  } catch (err) {
    console.error("createCategory error:", err);
    res.status(500).json({ error: err.message || "Failed to create category." });
  }
}

/**
 * PUT /api/categories/:type/:id
 * Updates a food group or packaging type.
 */
export async function updateCategory(req, res) {
  try {
    const { type } = req.params;
    const id = Number(req.params.id);
    const { code, name, parent_id, sort_order = 0 } = req.body;

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid category id." });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Name is required." });
    }

    if (type === "food_group") {
      const { rows } = await pool.query(
        `UPDATE food_groups
         SET code = $1,
             name = $2,
             parent_id = $3,
             sort_order = $4,
             updated_at = NOW()
         WHERE id = $5
         RETURNING id, code, name, parent_id, sort_order, created_at, updated_at`,
        [code || null, name.trim(), parent_id || null, sort_order, id]
      );

      if (!rows.length) {
        return res.status(404).json({ error: "Food group not found." });
      }

      return res.json(rows[0]);
    }

    if (type === "packaging_type") {
      const { rows } = await pool.query(
        `UPDATE packaging_types
         SET name = $1,
             sort_order = $2,
             updated_at = NOW()
         WHERE id = $3
         RETURNING id, name, sort_order, created_at, updated_at`,
        [name.trim(), sort_order, id]
      );

      if (!rows.length) {
        return res.status(404).json({ error: "Packaging type not found." });
      }

      return res.json(rows[0]);
    }

    return res.status(400).json({ error: "Invalid type. Use food_group or packaging_type." });
  } catch (err) {
    console.error("updateCategory error:", err);
    res.status(500).json({ error: err.message || "Failed to update category." });
  }
}

/**
 * DELETE /api/categories/:type/:id
 * Deletes a food group or packaging type.
 */
export async function deleteCategory(req, res) {
  try {
    const { type } = req.params;
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid category id." });
    }

    if (type === "food_group") {
      const { rows } = await pool.query(
        `DELETE FROM food_groups
         WHERE id = $1
         RETURNING id`,
        [id]
      );

      if (!rows.length) {
        return res.status(404).json({ error: "Food group not found." });
      }

      return res.json({ success: true });
    }

    if (type === "packaging_type") {
      const { rows } = await pool.query(
        `DELETE FROM packaging_types
         WHERE id = $1
         RETURNING id`,
        [id]
      );

      if (!rows.length) {
        return res.status(404).json({ error: "Packaging type not found." });
      }

      return res.json({ success: true });
    }

    return res.status(400).json({ error: "Invalid type. Use food_group or packaging_type." });
  } catch (err) {
    console.error("deleteCategory error:", err);
    res.status(500).json({ error: err.message || "Failed to delete category." });
  }
}
