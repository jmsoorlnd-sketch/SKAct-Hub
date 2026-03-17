import express from "express";
import { adminOnly, requireAuth } from "../middleware/Auth.js";
import {
  createOfficial,
  getAllOfficials,
  getOfficialById,
  updateOfficialStatus,
  updateOfficial,
  deleteOfficial,
  getDeletedUsers,
  restoreDeletedUser,
  permanentlyDeleteUser,
} from "../controllers/AdminController.js";

const router = express.Router();

// ✅ Create new official
router.post("/create-official", requireAuth, adminOnly, createOfficial);

// ✅ Get all officials
router.get("/getofficials", requireAuth, getAllOfficials);

// ✅ Get single official by ID
router.get("/officials/:id", requireAuth, getOfficialById);

// ✅ Update official status (Active/Inactive)
router.put("/status-official/:id", requireAuth, updateOfficialStatus);

// ✅ Update official details
router.put("/update-official/:id", requireAuth, updateOfficial);

// ✅ Delete official
router.delete("/delete-official/:id", requireAuth, adminOnly, deleteOfficial);

// ✅ Archive - Deleted Users
router.get("/archive/deleted-users", requireAuth, adminOnly, getDeletedUsers);
router.put(
  "/archive/restore-user/:id",
  requireAuth,
  adminOnly,
  restoreDeletedUser,
);
router.delete(
  "/archive/permanently-delete-user/:id",
  requireAuth,
  adminOnly,
  permanentlyDeleteUser,
);

export default router;
