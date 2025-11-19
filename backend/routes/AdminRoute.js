import express from "express";
import { isAdmin, requireSignIn } from "../middlewares/authMiddleware.js";
import {
  createOfficial,
  getAllOfficials,
  getOfficialById,
  resetOfficialPassword,
  deleteOfficial,
  updateOfficial,
} from "../controllers/AdminController.js";
import e from "express";

const router = express.Router();

//createOfficial
router.post("/officials", requireSignIn, isAdmin, createOfficial);
//getAllOfficials
router.get("/officials", requireSignIn, isAdmin, getAllOfficials);
//getOfficialById
router.get("/officials/:id", requireSignIn, isAdmin, getOfficialById);
//resetOfficialPassword
router.put(
  "/officials/reset-password/:id",
  requireSignIn,
  isAdmin,
  resetOfficialPassword
);
//deleteOfficial
router.delete("/officials/:id", requireSignIn, isAdmin, deleteOfficial);
//updateOfficial
router.put("/officials/:id", requireSignIn, isAdmin, updateOfficial);

export default router;
