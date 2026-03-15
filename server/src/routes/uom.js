import { Router } from "express";
import { getUoms } from "../controllers/uomController.js";

const router = Router();

router.get("/", getUoms);

export default router;
