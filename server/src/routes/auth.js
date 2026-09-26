// Auth routes: POST /api/auth/login, POST /api/auth/register

import { Router } from "express";
import { login, register } from "../controllers/authController.js";
import { createRateLimiter } from "../middleware/rateLimit.js";

const router = Router();
const ALLOW_PUBLIC_REGISTER = process.env.ALLOW_PUBLIC_REGISTER === "true";
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
});

const authRateLimiter = process.env.VERCEL
  ? (_req, _res, next) => next()
  : createRateLimiter({ windowMs: 15 * 60 * 1000, max: 30 });

export default router;
