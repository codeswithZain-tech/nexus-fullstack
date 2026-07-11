import express from "express";
import {
  sendMessage,
  getConversations,
  getMessages,
  markAsRead,
} from "../controllers/messageController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, sendMessage);
router.get("/conversations", protect, getConversations);
router.get("/:userId", protect, getMessages);
router.put("/:userId/read", protect, markAsRead);

export default router;
