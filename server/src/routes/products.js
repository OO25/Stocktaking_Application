import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productsController.js";

const router = Router();

router.use(requireAuth);

router.get("/", getProducts);
router.post("/", requireRole("admin"), createProduct);
router.put("/:id", requireRole("admin"), updateProduct);
router.delete("/:id", requireRole("admin"), deleteProduct);

export default router;
