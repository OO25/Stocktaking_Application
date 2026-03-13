import { Router } from "express";
import { getUsers } from "../controllers/usersController.js";

const router = Router();

router.get("/", getUsers);

export default router;
