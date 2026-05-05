import pool from "../config/db.js";

/**
 * GET /api/outlets
 * Returns all outlets. Supports optional pagination and search.
 * Query params: page, limit, search
 */
export async function getOutlets(req, res) {
  try {
    // If pagination params provided, return paginated results; otherwise return all
    const page = req.query.page ? Math.max(1, parseInt(req.query.page) || 1) : null;
    const limit = req.query.limit ? Math.max(1, parseInt(req.query.limit) || 10) : null;
    const search = (req.query.search || "").trim();

    const conditions = [];
    const values = [];

    if (search) {
      values.push(search);
      const idx = values.length;
      conditions.push(`(o.name ILIKE $${idx} OR o.cost_centre ILIKE $${idx} OR similarity(o.name, $${idx}) > 0.2 OR similarity(o.cost_centre, $${idx}) > 0.2)`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM outlets o ${where}`,
      values
    );
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Get data
    let query = `SELECT
      o.id,
      o.name,
      o.cost_centre,
      o.created_at,
      o.updated_at,
      COUNT(op.product_id)::int AS allocated_product_count
      FROM outlets o
      LEFT JOIN outlet_products op ON op.outlet_id = o.id
      ${where}
      GROUP BY o.id, o.name, o.cost_centre, o.created_at, o.updated_at
      ORDER BY o.name`;
    const queryValues = [...values];

    if (page && limit) {
      const offset = (page - 1) * limit;
      queryValues.push(limit, offset);
      query += ` LIMIT $${queryValues.length - 1} OFFSET $${queryValues.length}`;
    }

    const dataResult = await pool.query(query, queryValues);

    if (page && limit) {
      res.json({ rows: dataResult.rows, totalCount });
    } else {
      res.json(dataResult.rows);
    }
  } catch (err) {
    console.error("getOutlets error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch outlets." });
  }
}

/**
 * POST /api/outlets
 * Creates a new outlet. Expects { name, cost_centre } in body.
 */
export async function createOutlet(req, res) {
  const { name, cost_centre } = req.body;

  if (!name || cost_centre == null) {
    return res.status(400).json({ error: "Name and cost_centre are required." });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO outlets (name, cost_centre)
       VALUES ($1, $2)
       RETURNING id, name, cost_centre, created_at, updated_at`,
      [name.trim(), String(cost_centre).trim()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      const field = err.constraint?.includes("cost_centre") ? "Cost centre" : "Name";
      return res.status(409).json({ error: `${field} already exists.` });
    }
    console.error("createOutlet error:", err);
    res.status(500).json({ error: err.message || "Failed to create outlet." });
  }
}

/**
 * DELETE /api/outlets/:id
 * Deletes an outlet by id.
 */
export async function deleteOutlet(req, res) {
  const outletId = Number(req.params.id);
  if (!Number.isInteger(outletId)) {
    return res.status(400).json({ error: "Invalid outlet id." });
  }

  try {
    const { rows } = await pool.query(
      "DELETE FROM outlets WHERE id = $1 RETURNING id",
      [outletId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Outlet not found." });
    }

    return res.json({ success: true });
  } catch (err) {
    if (err.code === "23503") {
      return res.status(409).json({ error: "Outlet is in use and cannot be deleted." });
    }

    console.error("deleteOutlet error:", err);
    return res.status(500).json({ error: err.message || "Failed to delete outlet." });
  }
}

/**
 * PUT /api/outlets/:id
 * Updates an outlet by id. Expects { name, cost_centre } in body.
 */
export async function updateOutlet(req, res) {
  const outletId = Number(req.params.id);
  const { name, cost_centre } = req.body;

  if (!Number.isInteger(outletId)) {
    return res.status(400).json({ error: "Invalid outlet id." });
  }

  if (!name || cost_centre == null) {
    return res.status(400).json({ error: "Name and cost_centre are required." });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE outlets
       SET name = $1,
           cost_centre = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING id, name, cost_centre, created_at, updated_at`,
      [name.trim(), String(cost_centre).trim(), outletId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Outlet not found." });
    }

    return res.json(rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      const field = err.constraint?.includes("cost_centre") ? "Cost centre" : "Name";
      return res.status(409).json({ error: `${field} already exists.` });
    }

    console.error("updateOutlet error:", err);
    return res.status(500).json({ error: err.message || "Failed to update outlet." });
  }
}
