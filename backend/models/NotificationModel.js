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
        "message_approved",
        "message_rejected",
        "message_updated",
        "barangay_ongoing",
        "barangay_completed",
        "activity",
        "activity_update",
        "report_submitted",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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
