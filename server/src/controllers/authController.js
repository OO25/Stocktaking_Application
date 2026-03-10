// Handles login and register requests

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { findByUsername, createUser } from "../models/userModel.js";

const BCRYPT_SALT_ROUNDS = 10;
const JWT_EXPIRES_IN = "8h";

// POST /api/auth/login
// Verifies credentials and returns a signed JWT (Web token) on success
export async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required." });
    }

    const user = await findByUsername(username);

    // Return the same error whether the username or password is wrong
    // so attackers can't tell which one failed
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid username or password." });
    }

    // Sign a JWT containing the user's id, username and role
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("[authController] login error:", err);
    return res.status(500).json({ message: "An unexpected error occurred." });
  }
}

// POST /api/auth/register
// Creates a new user
export async function register(req, res) {
  try {
    const { username, password, role = "manager" } = req.body;

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

    // Hash the password before storing
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const newUser = await createUser(username, passwordHash, role);

    return res.status(201).json({ user: newUser });
  } catch (err) {
    console.error("[authController] register error:", err);
    return res.status(500).json({ message: "An unexpected error occurred." });
  }
}
