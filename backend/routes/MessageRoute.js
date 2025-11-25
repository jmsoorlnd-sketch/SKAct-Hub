import express from "express";
import { requireAuth } from "../middleware/Auth.js";
import {
  sendMessage,
  getInbox,
  markAsRead,
  deleteMessage,
  getAdmins,
} from "../controllers/MessageController.js";

const router = express.Router();

// Send a message
router.post("/send", requireAuth, sendMessage);

// Get inbox
router.get("/inbox", requireAuth, getInbox);

// Mark as read
router.put("/:messageId/read", requireAuth, markAsRead);

// Delete message
router.delete("/:messageId", requireAuth, deleteMessage);

// Get all admins
router.get("/admins/list", requireAuth, getAdmins);

export default router;
