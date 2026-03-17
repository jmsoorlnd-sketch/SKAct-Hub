import express from "express";
import { requireAuth, adminOnly } from "../middleware/auth.js";
import {
  logUserAction,
  getAllUserLogs,
  getLogsByUser,
  getLogsByBarangay,
  getLogsByActionType,
  getLogStatistics,
} from "../controllers/UserLogController.js";

const router = express.Router();

// ✅ Log user action (can be called by any authenticated user)
router.post("/log-action", requireAuth, logUserAction);

// ✅ Get all logs (admin only)
router.get("/all", requireAuth, adminOnly, getAllUserLogs);

// ✅ Get logs by user (admin only)
router.get("/user/:userId", requireAuth, adminOnly, getLogsByUser);

// ✅ Get logs by barangay (admin only)
router.get("/barangay/:barangayId", requireAuth, adminOnly, getLogsByBarangay);

// ✅ Get logs by action type (admin only)
router.get("/action/:actionType", requireAuth, adminOnly, getLogsByActionType);

// ✅ Get log statistics (admin only)
router.get("/statistics", requireAuth, adminOnly, getLogStatistics);

export default router;
