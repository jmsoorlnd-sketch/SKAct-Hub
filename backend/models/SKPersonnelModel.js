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
      enum: ["Active", "Inactive"],
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
      enum: ["Active", "Inactive"],
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
      enum: ["Active", "Inactive"],
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
        enum: ["Active", "Inactive"],
        default: "Active",
      },
      _id: mongoose.Schema.Types.ObjectId,
    },
  ],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const SKPersonnel = mongoose.model("SKPersonnel", skPersonnelSchema);

export default SKPersonnel;
