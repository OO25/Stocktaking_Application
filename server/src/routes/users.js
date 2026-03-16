import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import {
  createUserHandler,
  getUsers,
  updateUserHandler,
  deleteUserHandler,
} from "../controllers/usersController.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/", getUsers);
router.post("/", createUserHandler);
router.put("/:id", updateUserHandler);
router.delete("/:id", deleteUserHandler);

export default router;
