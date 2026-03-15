import { Router } from "express";
import {
  createUserHandler,
  getUsers,
  updateUserHandler,
  deleteUserHandler,
} from "../controllers/usersController.js";

const router = Router();

router.get("/", getUsers);
router.post("/", createUserHandler);
router.put("/:id", updateUserHandler);
router.delete("/:id", deleteUserHandler);

export default router;
