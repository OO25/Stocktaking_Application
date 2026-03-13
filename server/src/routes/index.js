import { Router } from "express";
import authRouter from "./auth.js";
import productsRouter from "./products.js";
import categoriesRouter from "./categories.js";
import suppliersRouter from "./suppliers.js";
import outletsRouter from "./outlets.js";

const router = Router();

// Auth routes: POST /api/auth/login, POST /api/auth/register
router.use("/auth", authRouter);

router.use("/products", productsRouter);
router.use("/categories", categoriesRouter);
router.use("/suppliers", suppliersRouter);
router.use("/outlets", outletsRouter);

export default router;
