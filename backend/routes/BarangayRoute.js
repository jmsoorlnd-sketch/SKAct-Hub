import express from "express";
import { requireAuth, adminOnly, officialOnly } from "../middleware/auth.js";
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
  getArchive,
  restoreFolder,
  hardDeleteFolder,
  updateFolderStatus,
  shareFolder,
  moveDocumentToFolder,
  deleteFolder,
  getDeletedBarangays,
  restoreDeletedBarangay,
  permanentlyDeleteBarangay,
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

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10 MB
const ATTACHMENT_EXTENSIONS = [".pdf", ".doc", ".docx"];

const attachmentFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ATTACHMENT_EXTENSIONS.includes(ext)) {
    return cb(new Error("Only PDF, DOC, DOCX files are allowed"));
  }
  return cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_ATTACHMENT_SIZE },
  fileFilter: attachmentFileFilter,
});

// Public routes
router.get("/all-barangays", getAllBarangays);

// User routes (must come BEFORE :barangayId routes to match /me/* first)
router.get("/me/barangay", requireAuth, getUserBarangay);
router.get("/me/storage", requireAuth, getMyBarangayStorage);

// Admin routes
router.post("/add-barangay", requireAuth, createBarangay);
router.put("/:id", requireAuth, adminOnly, updateBarangay);
router.delete("/:id", requireAuth, adminOnly, deleteBarangay);
router.get("/:barangayId/users", requireAuth, getUsersByBarangay); // admins can fetch all users of any barangay, officials can fetch own barangay users
router.post("/assign-user", requireAuth, adminOnly, assignUserToBarangay);
router.post("/remove-user", requireAuth, adminOnly, removeUserFromBarangay);
router.get("/:barangayId/storage", requireAuth, getBarangayStorage);
router.post(
  "/:barangayId/messages",
  requireAuth,
  upload.array("attachments"),
  createBarangayMessage,
);
router.get(
  "/:barangayId/messages",
  requireAuth,
  adminOnly,
  getBarangayMessages,
);

// Attach an existing message (by messageId) to a barangay
router.post(
  "/:barangayId/attach-message",
  requireAuth,
  attachMessageToBarangay,
);

// Detach a message from a barangay (remove storage entry and mark message un-attached)
router.delete(
  "/:barangayId/attach-message/:messageId",
  requireAuth,
  detachMessageFromBarangay,
);

router.get("/get-barangay/:id", requireAuth, getBarangayById);
router.get("/officials/:id", getOfficialsByBarangay);

// Folder routes
router.post("/:barangayId/folders", requireAuth, officialOnly, createFolder);
router.get("/:barangayId/folders", requireAuth, getFolders);
router.get("/:barangayId/archive", requireAuth, officialOnly, getArchive);
router.post(
  "/:barangayId/archive/folders/:folderId/restore",
  requireAuth,
  officialOnly,
  restoreFolder,
);
router.delete(
  "/:barangayId/archive/folders/:folderId/hard",
  requireAuth,
  officialOnly,
  hardDeleteFolder,
);
router.put(
  "/:barangayId/folders/:folderId/status",
  requireAuth,
  officialOnly,
  updateFolderStatus,
);
router.put(
  "/:barangayId/folders/:folderId/share",
  requireAuth,
  officialOnly,
  shareFolder,
);
router.put(
  "/:barangayId/storage/:storageId/move",
  requireAuth,
  moveDocumentToFolder,
);
router.delete(
  "/:barangayId/folders/:folderId",
  requireAuth,
  officialOnly,
  deleteFolder,
);

// Admin Archive Routes - Deleted Barangays
router.get(
  "/admin/archive/deleted-barangays",
  requireAuth,
  adminOnly,
  getDeletedBarangays,
);
router.put(
  "/admin/archive/restore-barangay/:id",
  requireAuth,
  adminOnly,
  restoreDeletedBarangay,
);
router.delete(
  "/admin/archive/permanently-delete-barangay/:id",
  requireAuth,
  adminOnly,
  permanentlyDeleteBarangay,
);

export default router;
