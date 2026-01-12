import express from "express";
import { requireAuth, adminOnly } from "../middleware/auth.js";
import {
  getAllBarangays,
  createBarangay,
  updateBarangay,
  deleteBarangay,
  getUsersByBarangay,
  assignUserToBarangay,
  removeUserFromBarangay,
  getBarangayStorage,
  getUserBarangay,
  getMyBarangayStorage,
  getBarangayById,
  getOfficialsByBarangay,
  createBarangayMessage,
  getBarangayMessages,
  attachMessageToBarangay,
  detachMessageFromBarangay,
  createFolder,
  getFolders,
  moveDocumentToFolder,
} from "../controllers/BarangayController.js";

const router = express.Router();

import multer from "multer";
import fs from "fs";
import path from "path";

// ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const unique = `${Date.now()}-${file.originalname}`;
    cb(null, unique);
  },
});

const upload = multer({ storage });

// Public routes
router.get("/all-barangays", getAllBarangays);

// User routes (must come BEFORE :barangayId routes to match /me/* first)
router.get("/me/barangay", requireAuth, getUserBarangay);
router.get("/me/storage", requireAuth, getMyBarangayStorage);

// Admin routes
router.post("/add-barangay", requireAuth, createBarangay);
router.put("/:id", requireAuth, adminOnly, updateBarangay);
router.delete("/:id", requireAuth, adminOnly, deleteBarangay);
router.get("/:barangayId/users", requireAuth, adminOnly, getUsersByBarangay);
router.post("/assign-user", requireAuth, adminOnly, assignUserToBarangay);
router.post("/remove-user", requireAuth, adminOnly, removeUserFromBarangay);
router.get("/:barangayId/storage", requireAuth, getBarangayStorage);
router.post(
  "/:barangayId/messages",
  requireAuth,
  upload.single("attachment"),
  createBarangayMessage
);
router.get(
  "/:barangayId/messages",
  requireAuth,
  adminOnly,
  getBarangayMessages
);

// Attach an existing message (by messageId) to a barangay
router.post(
  "/:barangayId/attach-message",
  requireAuth,
  attachMessageToBarangay
);

// Detach a message from a barangay (remove storage entry and mark message un-attached)
router.delete(
  "/:barangayId/attach-message/:messageId",
  requireAuth,
  detachMessageFromBarangay
);

router.get("/get-barangay/:id", requireAuth, getBarangayById);
router.get("/officials/:id", getOfficialsByBarangay);

// Folder routes
router.post("/:barangayId/folders", requireAuth, adminOnly, createFolder);
router.get("/:barangayId/folders", requireAuth, getFolders);
router.put(
  "/:barangayId/storage/:storageId/move",
  requireAuth,
  moveDocumentToFolder
);

export default router;
