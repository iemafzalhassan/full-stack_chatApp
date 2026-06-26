import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  deleteMessage,
  getMessages,
  getUsersForSidebar,
  markMessagesAsRead,
  sendMessage,
  updateMessage,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage);
router.patch("/read/:id", protectRoute, markMessagesAsRead);
router.put("/:id", protectRoute, updateMessage);
router.delete("/:id", protectRoute, deleteMessage);

export default router;
