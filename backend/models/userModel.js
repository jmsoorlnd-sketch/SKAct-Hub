import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  // email is optional - no unique constraint to allow multiple empty/null values
  // Uniqueness is enforced at the application level in AdminController
  email: { type: String, unique: true, sparse: true },

  // MAIN ROLE FIELD
  role: {
    type: String,
    enum: ["Youth", "Official", "Admin"],
    required: true,
  },

  password: { type: String, required: true, minlength: 8 },

  firstname: String,
  lastname: String,

  position: {
    type: String,
    enum: ["Chairman", "Treasurer", "Secretary", "Admin"],
  },

  age: Number,

  // human-readable barangay name (optional)
  barangayName: String,

  // profile image URL
  profileImage: String,

  civil: {
    type: String,
    enum: ["Single", "Married"],
    default: "Single",
  },
  barangay: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Barangay",
  },

  status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active",
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  // Login attempt tracking fields
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Date,
    default: null,
  },
  // Optional: track last login attempt time
  lastLoginAttempt: {
    type: Date,
    default: null,
  },
  // UserModel.js — add these fields before the closing of userSchema
  emailOtp: { type: String, default: null },
  emailOtpExpires: { type: Date, default: null },
  passwordResetToken: { type: String, default: null },
  passwordResetExpires: { type: Date, default: null },
});
userSchema.index({ emailOtpExpires: 1 }, { expireAfterSeconds: 0 });
const User = mongoose.model("User", userSchema);
export default User;
