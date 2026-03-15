import bcrypt from "bcryptjs";
import { createUser, findByUsername } from "../models/userModel.js";
import pool from "../config/db.js";

const BCRYPT_SALT_ROUNDS = 10;

/**
 * GET /api/users
 * Returns all users ordered by name.
 */
export async function getUsers(_req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, username, password_hash, role, created_at, updated_at
       FROM users
       ORDER BY name`
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
    const { name = "", username, password, role = "manager" } = req.body;

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
    const newUser = await createUser(name, username, passwordHash, role);

    return res.status(201).json({ user: newUser });
  } catch (err) {
    console.error("createUser error:", err);
    return res.status(500).json({ message: "An unexpected error occurred." });
  }
}
