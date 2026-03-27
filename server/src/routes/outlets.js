import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { getOutlets, createOutlet, deleteOutlet, updateOutlet } from "../controllers/outletsController.js";

const router = Router();

router.use(requireAuth);

router.get("/", getOutlets);
router.post("/", createOutlet);
router.put("/:id", updateOutlet);
router.delete("/:id", deleteOutlet);

export default router;
