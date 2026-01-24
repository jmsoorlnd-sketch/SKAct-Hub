import mongoose from "mongoose";

const activityUpdateSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      required: true,
    },
    barangay: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Barangay",
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    photoUrl: {
      type: String,
      required: true,
    },
    photoName: {
      type: String,
      required: true,
    },
    caption: {
      type: String,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

const ActivityUpdate = mongoose.model("ActivityUpdate", activityUpdateSchema);
export default ActivityUpdate;
