import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { getOutlets } from "../controllers/outletsController.js";

const router = Router();

router.use(requireAuth);

router.get("/", getOutlets);

export default router;
