import express from "express";
import { requireAuth } from "../middleware/Auth.js";
import {
  markNotificationAsSeen,
  markNotificationAsUnseen,
  markAllNotificationsAsSeen,
  getNotificationSeenStatus,
  batchMarkNotificationsAsSeen,
} from "../controllers/NotificationController.js";

const router = express.Router();

// Get all notification seen statuses for current user
router.get("/status", requireAuth, getNotificationSeenStatus);

// Mark all notifications as seen (MUST be before /:notificationId routes)
router.put("/all/seen", requireAuth, markAllNotificationsAsSeen);

// Batch mark notifications as seen
router.post("/batch/seen", requireAuth, batchMarkNotificationsAsSeen);

// Mark a notification as seen
router.put("/:notificationId/seen", requireAuth, markNotificationAsSeen);

// Mark a notification as unseen
router.put("/:notificationId/unseen", requireAuth, markNotificationAsUnseen);

export default router;
