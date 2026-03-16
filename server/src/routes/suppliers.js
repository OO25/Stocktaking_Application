import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "../controllers/suppliersController.js";

const router = Router();

router.use(requireAuth);

router.get("/", getSuppliers);
router.post("/", requireRole("admin"), createSupplier);
router.put("/:id", requireRole("admin"), updateSupplier);
router.delete("/:id", requireRole("admin"), deleteSupplier);

export default router;
