import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getSKPersonnelByBarangay,
  updateChairman,
  updateSecretary,
  updateTreasurer,
  addKagawad,
  updateKagawad,
  deleteKagawad,
} from "../controllers/SKPersonnelController.js";

const router = express.Router();

// Get SK Personnel for a barangay
router.get("/:barangayId", requireAuth, getSKPersonnelByBarangay);

// Update Chairman
router.put("/:barangayId/chairman", requireAuth, updateChairman);

// Update Secretary
router.put("/:barangayId/secretary", requireAuth, updateSecretary);

// Update Treasurer
router.put("/:barangayId/treasurer", requireAuth, updateTreasurer);

// Add Kagawad
router.post("/:barangayId/kagawad", requireAuth, addKagawad);

// Update Kagawad
router.put("/:barangayId/kagawad/:kagawadId", requireAuth, updateKagawad);

// Delete Kagawad
router.delete("/:barangayId/kagawad/:kagawadId", requireAuth, deleteKagawad);

export default router;
