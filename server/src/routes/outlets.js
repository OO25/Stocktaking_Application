import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { getOutlets, createOutlet } from "../controllers/outletsController.js";

const router = Router();

router.use(requireAuth);

router.get("/", getOutlets);
router.post("/", createOutlet);

export default router;
