import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },

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
    enum: ["Chairperson", "Treasurer", "Secretary", "Kagawad", "SK", "Admin"],
  },

  phone: { type: String, unique: true },
  age: Number,
  gender: { type: String, enum: ["Male", "Female"] },
  address: String,

  // human-readable barangay name (optional)
  barangayName: String,

  // profile image URL
  profileImage: String,

  civil: { type: String, enum: ["married", "unmarried"] },

  barangay: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Barangay",
  },

  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
export default User;
