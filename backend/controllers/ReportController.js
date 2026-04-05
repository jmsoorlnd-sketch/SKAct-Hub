import Report from "../models/ReportModel.js";
import User from "../models/userModel.js";
import Barangay from "../models/BarangayModel.js";

// Submit a report
export const submitReport = async (req, res) => {
  try {
    const {
      idNumber,
      pydp,
      objectives,
      startDate,
      budgetAllocated,
      budgetSpent,
    } = req.body;
    const submittedBy = req.user._id;

    // Get user's barangay
    const user = await User.findById(submittedBy).populate("barangay");
    if (!user || !user.barangay) {
      return res
        .status(400)
        .json({ message: "User not associated with a barangay" });
    }

    const report = new Report({
      idNumber,
      pydp,
      objectives,
      startDate,
      budgetAllocated,
      budgetSpent,
      barangay: user.barangay._id,
      submittedBy,
    });

    await report.save();
    res.status(201).json({ message: "Report submitted successfully", report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all reports (admin only)
export const getAllReports = async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const reports = await Report.find()
      .populate("barangay", "barangayName")
      .populate("submittedBy", "firstname lastname")
      .sort({ submittedAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get reports by barangay
export const getReportsByBarangay = async (req, res) => {
  try {
    const { barangayId } = req.params;

    const reports = await Report.find({ barangay: barangayId })
      .populate("barangay", "barangayName")
      .populate("submittedBy", "firstname lastname")
      .sort({ submittedAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get reports submitted by the authenticated official
export const getUserReports = async (req, res) => {
  try {
    const reports = await Report.find({ submittedBy: req.user._id })
      .populate("barangay", "barangayName")
      .sort({ submittedAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
