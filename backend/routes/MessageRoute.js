import express from "express";
import { requireAuth } from "../middleware/auth.js";
import multer from "multer";
import fs from "fs";
import path from "path";
import {
  sendMessage,
  getInbox,
  markAsRead,
  deleteMessage,
  restoreMessage,
  hardDeleteMessage,
  hardDeleteEvent,
  getAdmins,
  updateStatus,
  getSentMessages,
  getActivities,
  getMessagesByUser,
  approveMessageForBarangay,
  rejectMessage,
  uploadActivityUpdate,
  getActivityUpdates,
  deleteActivityUpdate,
} from "../controllers/MessageController.js";

const router = express.Router();

// ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const unique = `${Date.now()}-${file.originalname}`;
    cb(null, unique);
  },
});

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10 MB
const ATTACHMENT_EXTENSIONS = [".pdf", ".doc", ".docx"];

const attachmentFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ATTACHMENT_EXTENSIONS.includes(ext)) {
    return cb(new Error("Only PDF, DOC, DOCX files are allowed"));
  }
  return cb(null, true);
};

const imageFileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed for photo uploads"));
  }
  return cb(null, true);
};

const attachmentUpload = multer({
  storage,
  limits: { fileSize: MAX_ATTACHMENT_SIZE },
  fileFilter: attachmentFileFilter,
});

const photoUpload = multer({
  storage,
  limits: { fileSize: MAX_ATTACHMENT_SIZE },
  fileFilter: imageFileFilter,
});

// Send a message (supports single file upload 'attachment')
router.post(
  "/send",
  requireAuth,
  attachmentUpload.single("attachment"),
  sendMessage,
);

// Get inbox
router.get("/inbox", requireAuth, getInbox);

// Mark as read
router.put("/:messageId/read", requireAuth, markAsRead);

// Delete message
router.delete("/:messageId", requireAuth, deleteMessage);

// Restore (undelete) message
router.post("/:messageId/restore", requireAuth, restoreMessage);

// Hard delete message
router.delete("/:messageId/hard", requireAuth, hardDeleteMessage);

// Hard delete event (permanent deletion with cascading removal from all storage)
router.delete("/:messageId/hard-event", requireAuth, hardDeleteEvent);

// Get all admins
router.get("/admins/list", requireAuth, getAdmins);

// Get sent messages for logged in user
router.get("/sent", requireAuth, getSentMessages);

// Activities for calendar
router.get("/activities", requireAuth, getActivities);

// Activity Updates for documents (must come BEFORE /:documentId routes)
router.post(
  "/:documentId/activity-updates",
  requireAuth,
  photoUpload.single("photo"),
  uploadActivityUpdate,
);
router.get("/:documentId/activity-updates", requireAuth, getActivityUpdates);
router.delete("/activity-updates/:updateId", requireAuth, deleteActivityUpdate);

// Admin: get messages sent by a specific user
router.get("/user/:userId", requireAuth, getMessagesByUser);

// Update status (approve/reject/ongoing)
router.put("/:messageId/status", requireAuth, updateStatus);

// Admin: approve message and store to barangay
router.post("/admin/approve", requireAuth, approveMessageForBarangay);

// Admin: reject message
router.post("/admin/reject", requireAuth, rejectMessage);

export default router;
