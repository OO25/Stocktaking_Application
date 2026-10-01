import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { getOutlets, createOutlet, deleteOutlet, updateOutlet } from "../controllers/outletsController.js";

const router = Router();

router.use(requireAuth);

router.get("/", getOutlets);
router.post("/", requireRole("admin"), createOutlet);
router.put("/:id", requireRole("admin"), updateOutlet);
router.delete("/:id", requireRole("admin"), deleteOutlet);

export default router;
