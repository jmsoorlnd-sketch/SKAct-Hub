import express from "express";
import { requireAuth, adminOnly } from "../middleware/auth.js";
import {
  getAllBarangays,
  createBarangay,
  updateBarangay,
  deleteBarangay,
  getUsersByBarangay,
  assignUserToBarangay,
  getBarangayStorage,
  getUserBarangay,
  getMyBarangayStorage,
} from "../controllers/BarangayController.js";

const router = express.Router();

// Public routes
router.get("/", getAllBarangays);

// Admin routes
router.post("/", requireAuth, adminOnly, createBarangay);
router.put("/:id", requireAuth, adminOnly, updateBarangay);
router.delete("/:id", requireAuth, adminOnly, deleteBarangay);
router.get("/:barangayId/users", requireAuth, adminOnly, getUsersByBarangay);
router.post("/assign-user", requireAuth, adminOnly, assignUserToBarangay);
router.get("/:barangayId/storage", requireAuth, getBarangayStorage);

// User routes
router.get("/me/barangay", requireAuth, getUserBarangay);
router.get("/me/storage", requireAuth, getMyBarangayStorage);

export default router;
