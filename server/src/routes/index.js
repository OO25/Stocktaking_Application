import { Router } from "express";
import productsRouter from "./products.js";
import categoriesRouter from "./categories.js";
import suppliersRouter from "./suppliers.js";

const router = Router();

router.use("/products", productsRouter);
router.use("/categories", categoriesRouter);
router.use("/suppliers", suppliersRouter);

export default router;
