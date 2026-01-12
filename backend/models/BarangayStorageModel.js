import mongoose from "mongoose";

const barangayStorageSchema = new mongoose.Schema({
  barangay: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Barangay",
    required: true,
  },
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
    required: true,
  },
  folder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folder",
    default: null,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  documentName: String,
  documentUrl: String,
  description: String,
  createdAt: { type: Date, default: Date.now },
});

const BarangayStorage = mongoose.model(
  "BarangayStorage",
  barangayStorageSchema
);
export default BarangayStorage;
