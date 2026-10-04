import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoriesController.js";

const router = Router();

router.use(requireAuth);

router.get("/", getCategories);
router.post("/", requireRole("admin"), createCategory);
router.put("/:type/:id", requireRole("admin"), updateCategory);
router.delete("/:type/:id", requireRole("admin"), deleteCategory);

export default router;
