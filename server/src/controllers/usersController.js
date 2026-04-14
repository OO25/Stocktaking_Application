import bcrypt from "bcryptjs";
import { createUser, findByUsername, updateUser } from "../models/userModel.js";
import pool from "../config/db.js";

const BCRYPT_SALT_ROUNDS = 10;

/**
 * GET /api/users
 * Returns all users ordered by name.
 */
export async function getUsers(_req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT u.id,
              u.name,
              u.username,
              u.role,
              u.created_at,
              u.updated_at,
              COALESCE(
                ARRAY_AGG(uo.outlet_id) FILTER (WHERE uo.outlet_id IS NOT NULL),
                '{}'::int[]
              ) AS outlet_ids
       FROM users u
       LEFT JOIN user_outlets uo ON uo.user_id = u.id
       GROUP BY u.id
       ORDER BY u.name`
    );
    res.json(rows);
  } catch (err) {
    console.error("getUsers error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch users." });
  }
}

/**
 * POST /api/users
 * Creates a new user.
 */
export async function createUserHandler(req, res) {
  try {
    const { name = "", username, password, role = "manager", outlet_ids = [] } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required." });
    }

    const VALID_ROLES = ["admin", "manager"];
    if (!VALID_ROLES.includes(role)) {
      return res
        .status(400)
        .json({ message: `Role must be one of: ${VALID_ROLES.join(", ")}.` });
    }

    const existing = await findByUsername(username);
    if (existing) {
      return res
        .status(409)
        .json({ message: "That username is already taken." });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const newUser = await createUser(
        name,
        username,
        passwordHash,
        role,
        client,
      );

      const outletIds = Array.isArray(outlet_ids)
        ? outlet_ids.map(Number).filter((id) => Number.isInteger(id))
        : [];

      if (outletIds.length > 0) {
        await client.query(
          `INSERT INTO user_outlets (user_id, outlet_id)
           SELECT $1, UNNEST($2::int[])`,
          [newUser.id, outletIds],
        );
      }

      await client.query("COMMIT");
      return res.status(201).json({ user: newUser });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("createUser error:", err);
    return res.status(500).json({ message: "An unexpected error occurred." });
  }
}

/**
 * PUT /api/users/:id
 * Updates an existing user.
 */
export async function updateUserHandler(req, res) {
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId)) {
      return res.status(400).json({ message: "Invalid user id." });
    }

    const { name = "", username, password, role = "manager", outlet_ids = [] } = req.body;
    if (!username) {
      return res.status(400).json({ message: "Username is required." });
    }

    const VALID_ROLES = ["admin", "manager"];
    if (!VALID_ROLES.includes(role)) {
      return res
        .status(400)
        .json({ message: `Role must be one of: ${VALID_ROLES.join(", ")}.` });
    }

    const existing = await findByUsername(username);
    if (existing && existing.id !== userId) {
      return res
        .status(409)
        .json({ message: "That username is already taken." });
    }

    const passwordHash = password
      ? await bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
      : null;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const updatedUser = await updateUser(
        userId,
        name,
        username,
        role,
        passwordHash,
        client,
      );

      if (!updatedUser) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "User not found." });
      }

      const outletIds = Array.isArray(outlet_ids)
        ? outlet_ids.map(Number).filter((id) => Number.isInteger(id))
        : [];

      await client.query("DELETE FROM user_outlets WHERE user_id = $1", [userId]);

      if (outletIds.length > 0) {
        await client.query(
          `INSERT INTO user_outlets (user_id, outlet_id)
           SELECT $1, UNNEST($2::int[])`,
          [userId, outletIds],
        );
      }

      await client.query("COMMIT");
      return res.json({ user: updatedUser });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("updateUser error:", err);
    return res.status(500).json({ message: "An unexpected error occurred." });
  }
}

/**
 * DELETE /api/users/:id
 * Deletes a user.
 */
export async function deleteUserHandler(req, res) {
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId)) {
      return res.status(400).json({ message: "Invalid user id." });
    }

    const { rows } = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("deleteUser error:", err);
    return res.status(500).json({ message: "An unexpected error occurred." });
  }
}
