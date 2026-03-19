import pool from "../config/db.js";

/*
 * Returns all stocktake periods, newest first
 */
export async function getPeriods(_req, res) {
  try {
    const { rows } = await pool.query(
      "SELECT id, month, year, status FROM stocktake_periods ORDER BY year DESC, month DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("getPeriods error:", err);
    res.status(500).json({ error: "Failed to fetch periods." });
  }
}

/*
 * Creates a stocktake period for a given month/year, or returns it if one already exists
 */
export async function createPeriod(req, res) {
  try {
    const { month, year } = req.body;

    if (!month || !year || month < 1 || month > 12 || year < 2020) {
      return res.status(400).json({ message: "Valid month (1-12) and year (≥2020) are required." });
    }

    const { rows } = await pool.query(
      `INSERT INTO stocktake_periods (month, year)
       VALUES ($1, $2)
       ON CONFLICT (month, year) DO UPDATE SET month = EXCLUDED.month
       RETURNING id, month, year, status`,
      [month, year],
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("createPeriod error:", err);
    res.status(500).json({ message: "Failed to create period." });
  }
}

/*
 * Gets all stocktake sessions with their period and outlet info.
 * Non-admin users only see sessions for outlets they're assigned to.
 */
export async function getSessions(req, res) {
  try {
    const outletId = req.query.outlet_id ? Number(req.query.outlet_id) : null;

    const conditions = [];
    const params = [];

    if (outletId) {
      params.push(outletId);
      conditions.push(`ss.outlet_id = $${params.length}`);
    }

    if (req.user && req.user.role !== "admin") {
      const userOutlets = await pool.query(
        "SELECT outlet_id FROM user_outlets WHERE user_id = $1",
        [req.user.id],
      );
      const outletIds = userOutlets.rows.map((r) => r.outlet_id);

      if (outletIds.length === 0) {
        return res.json([]);
      }

      params.push(outletIds);
      conditions.push(`ss.outlet_id = ANY($${params.length})`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const { rows } = await pool.query(
      `SELECT
         ss.id,
         ss.period_id,
         ss.outlet_id,
         ss.status,
         ss.counted_by,
         ss.counted_date,
         sp.month,
         sp.year,
         sp.status AS period_status,
         o.name   AS outlet_name
       FROM stocktake_sessions ss
       JOIN stocktake_periods sp ON sp.id = ss.period_id
       JOIN outlets o            ON o.id  = ss.outlet_id
       ${where}
       ORDER BY sp.year DESC, sp.month DESC, o.name`,
      params,
    );

    res.json(rows);
  } catch (err) {
    console.error("getSessions error:", err);
    res.status(500).json({ error: "Failed to fetch sessions." });
  }
}

/*
 * Creates a new stocktake session for an outlet. If you pass month/year
 * instead of period_id, the period gets auto-created.
 */
export async function createSession(req, res) {
  try {
    let { period_id, outlet_id, month, year } = req.body;

    if (!outlet_id) {
      return res.status(400).json({ message: "Outlet (outlet_id) is required." });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      if (!period_id && month && year) {
        const { rows: periodRows } = await client.query(
          `INSERT INTO stocktake_periods (month, year)
           VALUES ($1, $2)
           ON CONFLICT (month, year) DO UPDATE SET month = EXCLUDED.month
           RETURNING id`,
          [month, year],
        );
        period_id = periodRows[0].id;
      }

      if (!period_id) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Period (period_id or month+year) is required." });
      }

      const existing = await client.query(
        "SELECT id FROM stocktake_sessions WHERE period_id = $1 AND outlet_id = $2",
        [period_id, outlet_id],
      );
      if (existing.rows.length > 0) {
        await client.query("ROLLBACK");
        return res.status(409).json({ message: "A stocktake session already exists for this outlet and period." });
      }

      const { rows } = await client.query(
        `INSERT INTO stocktake_sessions (period_id, outlet_id)
         VALUES ($1, $2)
         RETURNING id, period_id, outlet_id, status, counted_by, counted_date`,
        [period_id, outlet_id],
      );

      await client.query("COMMIT");

      const { rows: full } = await pool.query(
        `SELECT
           ss.id, ss.period_id, ss.outlet_id, ss.status, ss.counted_by, ss.counted_date,
           sp.month, sp.year, sp.status AS period_status,
           o.name AS outlet_name
         FROM stocktake_sessions ss
         JOIN stocktake_periods sp ON sp.id = ss.period_id
         JOIN outlets o            ON o.id  = ss.outlet_id
         WHERE ss.id = $1`,
        [rows[0].id],
      );

      res.status(201).json(full[0]);
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("createSession error:", err);
    res.status(500).json({ message: "Failed to create session." });
  }
}

/*
 * Deletes a stocktake session — only works if the session is still in draft
 */
export async function deleteSession(req, res) {
  try {
    const sessionId = Number(req.params.id);
    if (!Number.isInteger(sessionId)) {
      return res.status(400).json({ message: "Invalid session id." });
    }

    const { rows: check } = await pool.query(
      "SELECT status FROM stocktake_sessions WHERE id = $1",
      [sessionId],
    );

    if (check.length === 0) {
      return res.status(404).json({ message: "Session not found." });
    }

    if (check[0].status !== "draft") {
      return res.status(400).json({ message: "Only draft sessions can be deleted." });
    }

    await pool.query("DELETE FROM stocktake_sessions WHERE id = $1", [sessionId]);

    res.json({ success: true });
  } catch (err) {
    console.error("deleteSession error:", err);
    res.status(500).json({ message: "Failed to delete session." });
  }
}
