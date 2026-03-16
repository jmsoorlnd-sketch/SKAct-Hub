import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    attachmentUrl: {
      type: String,
      default: null,
    },
    attachmentName: {
      type: String,
      default: null,
    },
    // Activity dates for events sent by officials
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    // status: pending | approved | ongoing | rejected | completed
    status: {
      type: String,
      enum: ["pending", "approved", "ongoing", "rejected", "completed"],
      default: "pending",
    },
    // optional reason for rejection (admins can enter when rejecting)
    rejectionReason: {
      type: String,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    // attachedToBarangay: if message was moved/attached into a barangay storage
    isAttached: {
      type: Boolean,
      default: false,
    },
    attachedToBarangay: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Barangay",
      default: null,
    },
    // intendedFolder: if message was created from a folder, store the folder id for later assignment
    intendedFolder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },
    // isAdminScheduled: true if this is an event scheduled by the admin (not from an official)
    isAdminScheduled: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
