import { Router } from "express";
import {
  getUoms,
  createUom,
  updateUom,
  deleteUom
} from "../controllers/uomController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", getUoms);
router.post("/", requireRole("admin"), createUom);
router.put("/:id", requireRole("admin"), updateUom);
router.delete("/:id", requireRole("admin"), deleteUom);

export default router;
