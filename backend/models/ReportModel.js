import mongoose from "mongoose";

const reportSchema = new mongoose.Schema({
  idNumber: {
    type: String,
    required: true,
    match: /^\d+$/,
    unique: true,
  },
  pydp: {
    type: String,
    required: true,
    enum: [
      "Health",
      "Education",
      "Economic Empowerment",
      "Social Inclusion and Equity",
      "Peace Building and Security",
      "Governance",
      "Active Citizenship",
      "Environment Global Mobility",
    ],
  },
  objectives: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  budgetAllocated: {
    type: Number,
    required: true,
  },
  budgetSpent: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    default: "completed",
    enum: ["completed"],
  },
  barangay: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Barangay",
    required: true,
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

reportSchema.index({ idNumber: 1 }, { unique: true });

const Report = mongoose.models.Report || mongoose.model("Report", reportSchema);

export default Report;
