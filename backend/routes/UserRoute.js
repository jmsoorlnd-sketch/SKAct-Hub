import {
  signinUser,
  signupUser,
  createProfile,
  getUserProfile,
  getAllProfile,
  deleteUser,
} from "../controllers/UserController.js";
import express from "express";
import { requireAuth, adminOnly } from "../middleware/auth.js";
import multer from "multer";
import fs from "fs";
import path from "path";

const router = express.Router();

// ensure profile uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads/profiles");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// multer storage for profile images
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${req.user._id}${ext}`;
    cb(null, name);
  },
});

const uploadProfile = multer({
  storage: profileStorage,
  fileFilter: (req, file, cb) => {
    // allow only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

//route for user registration
router.post("/signup", signupUser);
//route for user login
router.post("/signin", signinUser);
//route for profile update
router.post("/create", requireAuth, createProfile);
//route for get user Profile
router.get("/me", requireAuth, getUserProfile);

// route to get all users (admin only)
router.get("/all", requireAuth, adminOnly, getAllProfile);

// route to delete a user (admin only)
router.delete("/:id", requireAuth, adminOnly, deleteUser);

// route to upload profile image
router.post(
  "/upload-image",
  requireAuth,
  uploadProfile.single("profileImage"),
  async (req, res) => {
    try {
      const User = (await import("../models/UserModel.js")).default;

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const profileImageUrl = `/uploads/profiles/${req.file.filename}`;
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { profileImage: profileImageUrl },
        { new: true }
      );

      res.status(200).json({
        message: "Profile image uploaded successfully",
        profileImage: profileImageUrl,
        user: updatedUser,
      });
    } catch (error) {
      console.error("Error uploading profile image:", error);
      res
        .status(500)
        .json({ message: "Error uploading image", error: error.message });
    }
  }
);

export default router;
