import express from "express";
import { adminOnly, requireAuth } from "../middleware/Auth.js";
import updateOfficialStatus, {
  createOfficial,
  getAllOfficials,
  getOfficialById,
  resetOfficialPassword,
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

router.put(
  "/status-official/:id",
  requireAuth,
  adminOnly,
  updateOfficialStatus
);
router.put("/update-official/:id", requireAuth, adminOnly, updateOfficial);

export default router;
