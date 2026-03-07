import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  // email is optional - no unique constraint to allow multiple empty/null values
  // Uniqueness is enforced at the application level in AdminController
  email: { type: String, sparse: true },

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
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
export default User;
