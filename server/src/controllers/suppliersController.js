import pool from "../config/db.js";

/**
 * GET /api/suppliers?search=
 * Returns all suppliers ordered by name. Supports optional fuzzy text search.
 */
export async function getSuppliers(req, res) {
  try {
    const search = (req.query.search ?? "").trim();

    const conditions = [];
    const params = [];

    if (search) {
      params.push(search);
      conditions.push(`s.name % $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const { rows } = await pool.query(
      `SELECT
         s.id,
         s.name,
         s.contact_name,
         s.email,
         s.phone,
         s.website_url AS website,
         s.created_at,
         s.updated_at,
         COUNT(p.id)::int AS allocated_product_count
       FROM suppliers s
       LEFT JOIN products p ON p.supplier_id = s.id
       ${where}
       GROUP BY s.id, s.name, s.contact_name, s.email, s.phone, s.website_url, s.created_at, s.updated_at
       ORDER BY s.name`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error("getSuppliers error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch suppliers." });
  }
}

/*
 * Creates a new supplier with the given name, email, phone, and website
 */
export async function createSupplier(req, res) {
  try {
    const { name, email, phone, website } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Supplier name is required." });
    }

    const { rows } = await pool.query(
      `INSERT INTO suppliers (name, email, phone, website_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, contact_name, email, phone, website_url AS website, created_at, updated_at`,
      [name.trim(), email || null, phone || null, website || null],
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("createSupplier error:", err);
    res.status(500).json({ message: "Failed to create supplier." });
  }
}

/*
 * Updates a supplier's details by id
 */
export async function updateSupplier(req, res) {
  try {
    const supplierId = Number(req.params.id);
    if (!Number.isInteger(supplierId)) {
      return res.status(400).json({ message: "Invalid supplier id." });
    }

    const { name, email, phone, website } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Supplier name is required." });
    }

    const { rows } = await pool.query(
      `UPDATE suppliers
       SET name = $1, email = $2, phone = $3, website_url = $4, updated_at = now()
       WHERE id = $5
       RETURNING id, name, contact_name, email, phone, website_url AS website, created_at, updated_at`,
      [name.trim(), email || null, phone || null, website || null, supplierId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Supplier not found." });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("updateSupplier error:", err);
    res.status(500).json({ message: "Failed to update supplier." });
  }
}

/*
 * Deletes a supplier by id — returns 404 if not found
 */
export async function deleteSupplier(req, res) {
  try {
    const supplierId = Number(req.params.id);
    if (!Number.isInteger(supplierId)) {
      return res.status(400).json({ message: "Invalid supplier id." });
    }

    const { rows } = await pool.query(
      "DELETE FROM suppliers WHERE id = $1 RETURNING id",
      [supplierId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Supplier not found." });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("deleteSupplier error:", err);
    res.status(500).json({ message: "Failed to delete supplier." });
  }
}
