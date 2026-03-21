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

/*
 * Retrieve a session with its full DTO for editing or viewing
 */
export async function getSessionDetail(req, res) {
  try {
    const sessionId = Number(req.params.id);
    console.log("getSessionDetail called with sessionId:", sessionId);
    if (!Number.isInteger(sessionId)) {
      return res.status(400).json({ message: "Invalid session id." });
    }

    // Fetch session details
    const { rows: sessionRows } = await pool.query(
      `SELECT
         ss.id,
         ss.period_id,
         ss.outlet_id,
         ss.status,
         ss.counted_by,
         ss.counted_date,
         sp.month,
         sp.year,
         o.name AS outlet_name
       FROM stocktake_sessions ss
       JOIN stocktake_periods sp ON sp.id = ss.period_id
       JOIN outlets o ON o.id = ss.outlet_id
       WHERE ss.id = $1`,
      [sessionId],
    );

    if (sessionRows.length === 0) {
      console.log("Session not found for ID:", sessionId);
      return res.status(404).json({ message: "Session not found." });
    }

    const session = sessionRows[0];
    console.log("Session found:", session);

    // Check permissions: non-admin users can only access their outlet sessions
    if (req.user && req.user.role !== "admin") {
      const { rows: userOutlets } = await pool.query(
        "SELECT outlet_id FROM user_outlets WHERE user_id = $1",
        [req.user.id],
      );
      const allowedOutlets = userOutlets.map((r) => r.outlet_id);
      if (!allowedOutlets.includes(session.outlet_id)) {
        return res.status(403).json({ message: "Access denied to this session." });
      }
    }

    // Fetch valid products for this outlet (joined with UOM and price)
    const { rows: validProducts } = await pool.query(
      `SELECT
         p.id AS product_id,
         p.name AS product_name,
         u.name AS uom_name,
         p.price AS unit_price
       FROM outlet_products op
       JOIN products p ON p.id = op.product_id
       LEFT JOIN units_of_measure u ON u.id = p.uom_id
       WHERE op.outlet_id = $1
       ORDER BY p.name`,
      [session.outlet_id],
    );
    
    console.log("Valid products found:", validProducts.length);

    // Fetch current entries for this session
    const { rows: currentEntries } = await pool.query(
      `SELECT
         se.id,
         se.product_id,
         se.quantity,
         se.unit_price
       FROM stocktake_entries se
       WHERE se.session_id = $1
       ORDER BY se.id`,
      [sessionId],
    );

    // Build and return DTO
    const dto = {
      session_id: session.id,
      period_month: session.month,
      period_year: session.year,
      outlet_name: session.outlet_name,
      status: session.status,
      counted_by: session.counted_by,
      counted_date: session.counted_date,
      valid_products: validProducts,
      current_entries: currentEntries,
    };

    console.log("Returning DTO:", JSON.stringify(dto, null, 2));
    res.json(dto);
  } catch (err) {
    console.error("getSessionDetail error:", err);
    res.status(500).json({ message: "Failed to fetch session detail." });
  }
}

/*
 * Save product count entries for a session
 */
export async function saveSessionEntries(req, res) {
  try {
    const sessionId = Number(req.params.id);
    if (!Number.isInteger(sessionId)) {
      return res.status(400).json({ message: "Invalid session id." });
    }

    const { entries = [], finalize = false } = req.body;

    if (!Array.isArray(entries)) {
      return res.status(400).json({ message: "Entries must be an array." });
    }

    // Fetch session and check permissions
    const { rows: sessionRows } = await pool.query(
      `SELECT ss.id, ss.outlet_id, ss.status, ss.counted_by, ss.counted_date
       FROM stocktake_sessions ss
       WHERE ss.id = $1`,
      [sessionId],
    );

    if (sessionRows.length === 0) {
      return res.status(404).json({ message: "Session not found." });
    }

    const session = sessionRows[0];

    // Check permissions
    if (req.user && req.user.role !== "admin") {
      const { rows: userOutlets } = await pool.query(
        "SELECT outlet_id FROM user_outlets WHERE user_id = $1",
        [req.user.id],
      );
      const allowedOutlets = userOutlets.map((r) => r.outlet_id);
      if (!allowedOutlets.includes(session.outlet_id)) {
        return res.status(403).json({ message: "Access denied to this session." });
      }
    }

    // Check if session is still editable
    if (session.status === "submitted" || session.status === "locked") {
      return res.status(400).json({ message: "Cannot edit a submitted or locked session." });
    }

    // Validate entries: must have product_id, quantity, unit_price
    for (const entry of entries) {
      if (!entry.product_id || entry.quantity === undefined || entry.unit_price === undefined) {
        return res.status(400).json({
          message: "Each entry must have product_id, quantity, and unit_price.",
        });
      }
      if (isNaN(entry.quantity) || isNaN(entry.unit_price)) {
        return res.status(400).json({ message: "Quantity and unit_price must be numeric." });
      }
      if (entry.quantity < 0 || entry.unit_price < 0) {
        return res.status(400).json({ message: "Quantity and unit_price must not be negative." });
      }
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Get existing entry IDs to determine which to delete
      const { rows: existingEntries } = await client.query(
        "SELECT product_id FROM stocktake_entries WHERE session_id = $1",
        [sessionId],
      );
      const existingProductIds = new Set(existingEntries.map((e) => e.product_id));
      const newProductIds = new Set(entries.map((e) => e.product_id));

      // Delete entries that are no longer in the new list
      for (const existingId of existingProductIds) {
        if (!newProductIds.has(existingId)) {
          await client.query(
            "DELETE FROM stocktake_entries WHERE session_id = $1 AND product_id = $2",
            [sessionId, existingId],
          );
        }
      }

      // Upsert entries
      for (const entry of entries) {
        await client.query(
          `INSERT INTO stocktake_entries (session_id, product_id, quantity, unit_price)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (session_id, product_id)
           DO UPDATE SET
             quantity = EXCLUDED.quantity,
             unit_price = EXCLUDED.unit_price`,
          [sessionId, entry.product_id, entry.quantity, entry.unit_price],
        );
      }

      // Auto-advance status from draft to in_progress on first save
      let newStatus = session.status;
      if (session.status === "draft" && entries.length > 0) {
        newStatus = "in_progress";
      }

      // Prepare updates for session
      let countedBy = session.counted_by || req.user?.username || null;
      let countedDate = session.counted_date;

      if (finalize) {
        countedDate = new Date().toISOString().split("T")[0]; // Today's date in YYYY-MM-DD
        newStatus = "submitted";
      }

      // Update session
      await client.query(
        `UPDATE stocktake_sessions
         SET status = $1, counted_by = $2, counted_date = $3
         WHERE id = $4`,
        [newStatus, countedBy, countedDate, sessionId],
      );

      await client.query("COMMIT");

      res.json({ success: true, status: newStatus });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("saveSessionEntries error:", err);
    res.status(500).json({ message: "Failed to save entries." });
  }
}

/*
 * Submit a session for final approval
 */
export async function submitSession(req, res) {
  try {
    const sessionId = Number(req.params.id);
    if (!Number.isInteger(sessionId)) {
      return res.status(400).json({ message: "Invalid session id." });
    }

    // Fetch session
    const { rows: sessionRows } = await pool.query(
      `SELECT ss.id, ss.outlet_id, ss.status, ss.counted_by, ss.counted_date
       FROM stocktake_sessions ss
       WHERE ss.id = $1`,
      [sessionId],
    );

    if (sessionRows.length === 0) {
      return res.status(404).json({ message: "Session not found." });
    }

    const session = sessionRows[0];

    // Check permissions
    if (req.user && req.user.role !== "admin") {
      const { rows: userOutlets } = await pool.query(
        "SELECT outlet_id FROM user_outlets WHERE user_id = $1",
        [req.user.id],
      );
      const allowedOutlets = userOutlets.map((r) => r.outlet_id);
      if (!allowedOutlets.includes(session.outlet_id)) {
        return res.status(403).json({ message: "Access denied to this session." });
      }
    }

    // Check if already submitted
    if (session.status === "submitted" || session.status === "locked") {
      return res.status(400).json({ message: "Session is already submitted or locked." });
    }

    // Prepare update data
    const countedBy = session.counted_by || req.user?.username || "unknown";
    const countedDate = session.counted_date || new Date().toISOString().split("T")[0];

    // Update session to submitted
    await pool.query(
      `UPDATE stocktake_sessions
       SET status = $1, counted_by = $2, counted_date = $3
       WHERE id = $4`,
      ["submitted", countedBy, countedDate, sessionId],
    );

    res.json({ success: true });
  } catch (err) {
    console.error("submitSession error:", err);
    res.status(500).json({ message: "Failed to submit session." });
  }
}
