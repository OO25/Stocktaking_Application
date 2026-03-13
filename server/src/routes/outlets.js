import { Router } from "express";
import { getOutlets } from "../controllers/outletsController.js";

const router = Router();

router.get("/", getOutlets);

export default router;
