import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notificationId: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "message_pending",
        "barangay_ongoing",
        "barangay_completed",
        "activity",
        "activity_update",
      ],
      required: true,
    },
    seen: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// Compound index to ensure unique notification per user
notificationSchema.index({ user: 1, notificationId: 1 }, { unique: true });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
