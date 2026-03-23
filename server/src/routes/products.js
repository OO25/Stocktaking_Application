import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productsController.js";

const router = Router();

router.use(requireAuth);

router.get("/", getProducts);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;
