import { Router } from "express";
import {
  getUoms,
  createUom,
  updateUom,
  deleteUom
} from "../controllers/uomController.js";

const router = Router();

router.get("/", getUoms);
router.post("/", createUom);
router.put("/:id", updateUom);
router.delete("/:id", deleteUom);

export default router;
