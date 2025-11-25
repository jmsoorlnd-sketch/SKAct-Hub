import express from "express";
import { adminOnly, requireAuth } from "../middleware/Auth.js";
import {
  createOfficial,
  getAllOfficials,
  getOfficialById,
  resetOfficialPassword,
  deleteOfficial,
  updateOfficial,
} from "../controllers/AdminController.js";

const router = express.Router();

// ✅ Protected routes
router.post("/addofficial", requireAuth, adminOnly, createOfficial);
router.get("/getofficials", requireAuth, getAllOfficials);
router.get("/officials/:id", requireAuth, adminOnly, getOfficialById);
router.put(
  "/officials/reset-password/:id",
  requireAuth,
  adminOnly,
  resetOfficialPassword
);
router.delete("/officials/:id", requireAuth, adminOnly, deleteOfficial);
router.put("/officials/:id", requireAuth, adminOnly, updateOfficial);

export default router;
