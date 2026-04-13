import pool from "../config/db.js";

// ============================================
// HELPERS >^.^<
// ============================================

/*
 * HELPER FUNCTION SO NO REUSED CODE
 * Checks if user has acess to a session based of its outlet_id
 */
async function checkSessionAccess(req, sessionOutletId) {
  if (req.user && req.user.role !== "admin") {
    const { rows: userOutlets } = await pool.query(
      "SELECT outlet_id FROM user_outlets WHERE user_id = $1",
      [req.user.id],
    );
    const allowedOutlets = userOutlets.map((r) => r.outlet_id);
    if (!allowedOutlets.includes(sessionOutletId)) {
      throw new Error("Access denied");
    }
  }
}

/*
 * HELPER FUNCTION SO NOT REUSED CODE
 * Builds a data transfer object, which combines all info for the frontend into a box,
 * instead of it having to get all the data
 */
function buildSessionDetailDTO(session, validProducts, currentEntries) {
  return {
    session_id: session.id,
    assignment_name: session.name,
    period_month: session.month,
    period_year: session.year,
    outlet_name: session.outlet_name,
    status: session.status,
    counted_by: session.counted_by,
    counted_date: session.counted_date,
    valid_products: validProducts,
    current_entries: currentEntries,
  };
}

// ============================================
// PERIODS >^.^<
// ============================================

/*
 * Returns all stocktake periods, newest first
  * URL: GET /api/stocktake/periods
  * Selects id - etc from periods table, ordered by year
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
  * URL: POST /api/stocktake/periods
  * Uses INSERT INTO... ON CONFLICT...DO UPDATE that:
  * Tries to insert a new peiod, if that period exists (conflict), updates it setting month to itself
  * Ensures theres no duplicates
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

// ============================================
// SESSIONS >^.^<
// ============================================

/**
 * Gets all stocktake sessions with their period and outlet info
 * Non-admin users only see sessions for outlets they're assigned to
 * Managers (non-admin users) see only stocktakes for their assigned outlets.
 * URL: GET /api/stocktake/sessions
 * 
 */
export async function getSessions(req, res) {
  try {
    const outletId = req.query.outlet_id ? Number(req.query.outlet_id) : null;
    // Arrays for dynamic query building (Conditionally adds filters to arrays)
    const conditions = [];
    const params = [];

    // If outlet filter is provided
    if (outletId) {
      params.push(outletId);
      conditions.push(`ss.outlet_id = $${params.length}`);
    }

    // Permission check: Non-admin users can only see sessions for their assigned outlets
    if (req.user && req.user.role !== "admin") {
      const { rows: userOutlets } = await pool.query(
        "SELECT outlet_id FROM user_outlets WHERE user_id = $1",
        [req.user.id],
      );
      const outletIds = userOutlets.map((r) => r.outlet_id);

      // If user has no assigned outlets, return empty list
      if (outletIds.length === 0) {
        console.log(`User ${req.user.id} (${req.user.role}) has no assigned outlets`);
        return res.json([]);
      }

      // Add user's outlet restriction to conditions
      params.push(outletIds);
      conditions.push(`ss.outlet_id = ANY($${params.length}::integer[])`);
      console.log(`User ${req.user.id} (${req.user.role}) can access ${outletIds.length} outlets`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    // Main query with ${where} for filter
    const { rows } = await pool.query(
      `SELECT
         ss.id,
         ss.period_id,
         ss.outlet_id,
         ss.name,
         ss.status,
         ss.counted_by,
         ss.counted_date,
         sp.month,
         sp.year,
         sp.status AS period_status,
         o.name   AS outlet_name,
         COALESCE(SUM(se.quantity * se.unit_price), 0) AS total_value
       FROM stocktake_sessions ss
       JOIN stocktake_periods sp ON sp.id = ss.period_id
       JOIN outlets o            ON o.id  = ss.outlet_id
       LEFT JOIN stocktake_entries se ON se.session_id = ss.id
       ${where}
       GROUP BY
         ss.id,
         ss.period_id,
         ss.outlet_id,
         ss.name,
         ss.status,
         ss.counted_by,
         ss.counted_date,
         sp.month,
         sp.year,
         sp.status,
         o.name
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
 * URL: POST /api/stocktake/sessions
 * 
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

      // Same logic as createPeriod
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

      // Final validation
      if (!period_id) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Period (period_id or month+year) is required." });
      }

      // Ensures no duplicates
      const existing = await client.query(
        "SELECT id FROM stocktake_sessions WHERE period_id = $1 AND outlet_id = $2",
        [period_id, outlet_id],
      );
      if (existing.rows.length > 0) {
        await client.query("ROLLBACK");
        return res.status(409).json({ message: "A stocktake session already exists for this outlet and period." });
      }

      const { rows: namingRows } = await client.query(
        `SELECT
           o.name AS outlet_name,
           sp.month,
           sp.year
         FROM outlets o
         JOIN stocktake_periods sp ON sp.id = $1
         WHERE o.id = $2`,
        [period_id, outlet_id],
      );

      if (namingRows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Invalid outlet_id or period_id." });
      }

      const { outlet_name, month: periodMonth, year: periodYear } = namingRows[0];

      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];

      const assignmentName = `${outlet_name} - ${monthNames[periodMonth - 1]} ${periodYear}`;

      const { rows } = await client.query(
        `INSERT INTO stocktake_sessions (period_id, outlet_id, name)
         VALUES ($1, $2, $3)
         RETURNING id, period_id, outlet_id, name, status, counted_by, counted_date`,
        [period_id, outlet_id, assignmentName],
      );

      await client.query("COMMIT");

      // After session is created, gets all joined data
      const { rows: full } = await pool.query(
        `SELECT
           ss.id,
           ss.period_id,
           ss.outlet_id,
           ss.name,
           ss.status,
           ss.counted_by,
           ss.counted_date,
           sp.month,
           sp.year,
           sp.status AS period_status,
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
 * Deletes a stocktake session if its still in draft
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
  * URL: GET /api/stocktake/sessions/:id/detail
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
         ss.name,
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

    // Check permissions
    try {
      await checkSessionAccess(req, session.outlet_id);
    } catch (err) {
      return res.status(403).json({ message: "Access denied to this session." });
    }

    // Fetch valid products for this outlet (joined with UOM and price)
    // Includes product_code (barcode) for search functionality
    const { rows: validProducts } = await pool.query(
      `SELECT
         p.id AS product_id,
         p.name AS product_name,
         p.is_packaging,
         p.product_code AS barcode,
         COALESCE(fg.name, pt.name) AS category_name,
         u.name AS uom_name,
         p.price AS unit_price,
         p.product_code AS barcode
       FROM outlet_products op
       JOIN products p ON p.id = op.product_id
       LEFT JOIN food_groups fg ON fg.id = p.food_group_id
       LEFT JOIN packaging_types pt ON pt.id = p.packaging_type_id
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
    const dto = buildSessionDetailDTO(session, validProducts, currentEntries);

    console.log("Returning DTO:", JSON.stringify(dto, null, 2));
    res.json(dto);
  } catch (err) {
    console.error("getSessionDetail error:", err);
    res.status(500).json({ message: "Failed to fetch session detail." });
  }
}

// ============================================
// SESSION ENTRIES >^.^<
// ============================================

/*
 * Save product count entries for a session
 * URL: POST /api/stocktake/sessions/:id/entries
 * 
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
    try {
      await checkSessionAccess(req, session.outlet_id);
    } catch (err) {
      return res.status(403).json({ message: "Access denied to this session." });
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
 * URL: POST /api/stocktake/sessions/:id/submit
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
    try {
      await checkSessionAccess(req, session.outlet_id);
    } catch (err) {
      return res.status(403).json({ message: "Access denied to this session." });
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
