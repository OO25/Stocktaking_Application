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
  createSessionTemporaryItem,
  updateSessionTemporaryItem,
  deleteSessionTemporaryItem,
  submitSession,
  updateSessionStatus,
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
router.patch("/sessions/:id/status", requireRole("admin"), updateSessionStatus);
router.put("/sessions/:id/entries", requireRole("admin", "manager"), saveSessionEntries);
router.post("/sessions/:id/new-items", requireRole("admin", "manager"), createSessionTemporaryItem);
router.patch("/sessions/:id/new-items/:itemId", requireRole("admin", "manager"), updateSessionTemporaryItem);
router.delete("/sessions/:id/new-items/:itemId", requireRole("admin", "manager"), deleteSessionTemporaryItem);
router.post("/sessions/:id/submit", requireRole("admin", "manager"), submitSession);
router.delete("/sessions/:id", requireRole("admin"), deleteSession);

export default router;
