import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import {
  getPeriods,
  createPeriod,
  getSessions,
  createSession,
  deleteSession,
  getSessionDetail,
  saveSessionEntries,
  submitSession,
} from "../controllers/stocktakeController.js";

const router = Router();

router.use(requireAuth);

// Periods
router.get("/periods", getPeriods);
router.post("/periods", requireRole("admin"), createPeriod);

// Sessions
router.get("/sessions", getSessions);
router.post("/sessions", requireRole("admin"), createSession);
router.get("/sessions/:id/detail", getSessionDetail);
router.put("/sessions/:id/entries", saveSessionEntries);
router.post("/sessions/:id/submit", submitSession);
router.delete("/sessions/:id", requireRole("admin"), deleteSession);

export default router;
