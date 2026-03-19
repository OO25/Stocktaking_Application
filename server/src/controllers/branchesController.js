import pool from "../config/db.js";

/**
 * GET /api/branches
 * Returns paginated outlets, aliasing cost_centre as branch_number.
 * Query params: page, limit, search
 */
export async function getOutlets(req, res) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const search = (req.query.search || "").trim();
  const offset = (page - 1) * limit;

  try {
    const conditions = [];
    const values = [];

    if (search) {
      values.push(`%${search}%`);
      conditions.push(`(name ILIKE $${values.length} OR cost_centre ILIKE $${values.length})`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM outlets ${where}`,
      values
    );
    const totalCount = parseInt(countResult.rows[0].count, 10);

    values.push(limit, offset);
    const dataResult = await pool.query(
      `SELECT id, name, cost_centre AS branch_number
       FROM outlets
       ${where}
       ORDER BY name
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    res.json({ rows: dataResult.rows, totalCount });
  } catch (err) {
    console.error("getOutlets error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch outlets." });
  }
}

/**
 * POST /api/branches
 * Creates a new outlet. Expects { name, branch_number } in body.
 */
export async function createOutlet(req, res) {
  const { name, branch_number } = req.body;

  if (!name || branch_number == null) {
    return res.status(400).json({ message: "name and branch_number are required." });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO outlets (name, cost_centre)
       VALUES ($1, $2)
       RETURNING id, name, cost_centre AS branch_number`,
      [name.trim(), String(branch_number).trim()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      const field = err.constraint?.includes("cost_centre") ? "Branch number" : "Name";
      return res.status(409).json({ message: `${field} already exists.` });
    }
    console.error("createOutlet error:", err);
    res.status(500).json({ error: err.message || "Failed to create outlet." });
  }
}
