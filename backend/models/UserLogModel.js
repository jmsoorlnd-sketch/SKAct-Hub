import mongoose from "mongoose";

const userLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  username: String,
  firstname: String,
  lastname: String,
  barangayId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Barangay",
  },
  barangayName: String,
  role: String,

  // Log types: 'login', 'logout', 'delete_message', 'send_document', 'account_change', etc.
  actionType: {
    type: String,
    enum: [
      "login",
      "logout",
      "delete_message",
      "send_document",
      "account_change",
      "delete_document",
      "create_folder",
      "delete_folder",
      "restore_document",
      "set_sk_personnel",
      "edit_sk_personnel",
      "delete_sk_personnel",
      "create_user",
      "edit_user",
      "delete_user",
      "delete_barangay",
      "restore_barangay",
      "approve_message",
      "reject_message",
      "other",
    ],
    required: true,
  },

  // Description of the action
  description: String,

  // IP address (if available)
  ipAddress: String,

  // User agent (browser/device info)
  userAgent: String,

  // Timestamp
  createdAt: { type: Date, default: Date.now },
});

const UserLog = mongoose.model("UserLog", userLogSchema);
export default UserLog;
