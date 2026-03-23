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
      values.push(`%${search}%`);
      conditions.push(`(name ILIKE $${values.length} OR cost_centre ILIKE $${values.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM outlets ${where}`,
      values
    );
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Get data
    let query = `SELECT id, name, cost_centre FROM outlets ${where} ORDER BY name`;
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
       RETURNING id, name, cost_centre`,
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
