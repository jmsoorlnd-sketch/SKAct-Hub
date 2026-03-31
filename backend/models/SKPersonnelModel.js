import mongoose from "mongoose";

const skPersonnelSchema = new mongoose.Schema({
  barangay: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Barangay",
    required: true,
  },

  // SK Officials
  chairman: {
    surname: String,
    firstName: String,
    middleName: String,
    age: Number,
    status: {
      type: String,
      enum: ["Active", "Inactive", "Resigned"],
      default: "Active",
    },
  },

  secretary: {
    surname: String,
    firstName: String,
    middleName: String,
    age: Number,
    status: {
      type: String,
      enum: ["Active", "Inactive", "Resigned"],
      default: "Active",
    },
  },

  treasurer: {
    surname: String,
    firstName: String,
    middleName: String,
    age: Number,
    status: {
      type: String,
      enum: ["Active", "Inactive", "Resigned"],
      default: "Active",
    },
  },

  // SK Kagawad (list of members)
  kagawad: [
    {
      surname: String,
      firstName: String,
      middleName: String,
      age: Number,
      status: {
        type: String,
        enum: ["Active", "Inactive", "Resigned"],
        default: "Active",
      },
      isDeleted: {
        type: Boolean,
        default: false,
      },
      deletedAt: Date,
      deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      _id: mongoose.Schema.Types.ObjectId,
    },
  ],

  history: [
    {
      role: String, // 'chairman' | 'secretary' | 'treasurer' | 'kagawad'
      memberId: mongoose.Schema.Types.ObjectId,
      name: String,
      status: String,
      action: String,
      changedBy: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        username: String,
      },
      changedAt: { type: Date, default: Date.now },
      details: String,
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const SKPersonnel = mongoose.model("SKPersonnel", skPersonnelSchema);

export default SKPersonnel;
