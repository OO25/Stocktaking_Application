import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { getCategories } from "../controllers/categoriesController.js";

const router = Router();

router.use(requireAuth);

router.get("/", getCategories);

export default router;
