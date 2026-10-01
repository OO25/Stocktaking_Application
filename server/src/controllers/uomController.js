import pool from "../config/db.js";

/**
 * GET /api/uom
 * Returns all units of measure ordered by name.
 */
export async function getUoms(_req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT
         u.id,
         u.name,
         u.description,
         u.created_at,
         u.updated_at,
         (COUNT(p.id) + (SELECT COUNT(*) FROM stocktake_new_items ni WHERE ni.uom_id = u.id))::int AS allocated_product_count
       FROM units_of_measure u
       LEFT JOIN products p ON p.uom_id = u.id
       GROUP BY u.id, u.name, u.description, u.created_at, u.updated_at
       ORDER BY LOWER(u.name), u.id`
    );
    res.json(rows);
  } catch (err) {
    console.error("getUoms error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch units." });
  }
}

/**
 * POST /api/uom
 * Creates a new unit of measure.
 */
export async function createUom(req, res) {
  try {
    const { name, description } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Name is required." });
    }

    const { rows: duplicates } = await pool.query(
      "SELECT id FROM units_of_measure WHERE LOWER(BTRIM(name)) = LOWER(BTRIM($1)) AND ($2::int IS NULL OR id <> $2)",
      [name, null]
    );
    if (duplicates.length) {
      return res.status(409).json({ error: "A unit with this name already exists." });
    }

    const { rows } = await pool.query(
      `INSERT INTO units_of_measure (name, description)
       VALUES ($1, $2)
       RETURNING id, name, description, created_at, updated_at`,
      [name.trim(), description ? description.trim() : null]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "A unit with this name already exists." });
    }
    console.error("createUom error:", err);
    res.status(500).json({ error: err.message || "Failed to create unit." });
  }
}

/**
 * PUT /api/uom/:id
 * Updates a unit of measure.
 */
export async function updateUom(req, res) {
  try {
    const id = Number(req.params.id);
    const { name, description } = req.body;

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid UOM id." });
    }

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Name is required." });
    }

    const { rows: duplicates } = await pool.query(
      "SELECT id FROM units_of_measure WHERE LOWER(BTRIM(name)) = LOWER(BTRIM($1)) AND ($2::int IS NULL OR id <> $2)",
      [name, id]
    );
    if (duplicates.length) {
      return res.status(409).json({ error: "A unit with this name already exists." });
    }

    const { rows } = await pool.query(
      `UPDATE units_of_measure
       SET name = $1,
           description = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, name, description, created_at, updated_at`,
      [name.trim(), description ? description.trim() : null, id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Unit not found." });
    }

    res.json(rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "A unit with this name already exists." });
    }
    console.error("updateUom error:", err);
    res.status(500).json({ error: err.message || "Failed to update unit." });
  }
}

/**
 * DELETE /api/uom/:id
 * Deletes a unit of measure.
 */
export async function deleteUom(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid UOM id." });
    }

    const { rows } = await pool.query(
      `DELETE FROM units_of_measure
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Unit not found." });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("deleteUom error:", err);
    res.status(500).json({ error: err.message || "Failed to delete unit." });
  }
}
