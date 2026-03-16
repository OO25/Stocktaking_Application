import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { getProducts, createProduct } from "../controllers/productsController.js";

const router = Router();

router.use(requireAuth);

router.get("/", getProducts);
router.post("/", createProduct);

export default router;
