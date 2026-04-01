import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoriesController.js";

const router = Router();

router.use(requireAuth);

router.get("/", getCategories);
router.post("/", createCategory);
router.put("/:type/:id", updateCategory);
router.delete("/:type/:id", deleteCategory);

export default router;
