import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  submitReport,
  getAllReports,
  getReportsByBarangay,
  getUserReports,
} from "../controllers/ReportController.js";

const router = express.Router();

// Submit a report (for officials)
router.post("/submit", requireAuth, submitReport);

// Get reports submitted by the authenticated official
router.get("/mine", requireAuth, getUserReports);

// Get all reports (admin)
router.get("/", requireAuth, getAllReports);

// Get reports by barangay (optional, for filtering)
router.get("/barangay/:barangayId", requireAuth, getReportsByBarangay);

export default router;
