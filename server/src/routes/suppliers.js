import { Router } from "express";
import { getSuppliers } from "../controllers/suppliersController.js";

const router = Router();

router.get("/", getSuppliers);

export default router;
