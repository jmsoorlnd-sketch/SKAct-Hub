import Report from "../models/ReportModel.js";
import User from "../models/userModel.js";
import Barangay from "../models/BarangayModel.js";
import { createAndEmitNotification } from "./NotificationController.js";

// Submit a report
export const submitReport = async (req, res) => {
  try {
    const {
      idNumber,
      pydp,
      programName,
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

    if (!/^[0-9]{5}$/.test(idNumber)) {
      return res
        .status(400)
        .json({ message: "Reference ID number must be exactly 5 digits." });
    }

    const existingReport = await Report.findOne({ idNumber });
    if (existingReport) {
      return res.status(400).json({
        message:
          "Reference ID number already taken. Please use another Reference ID.",
      });
    }

    const report = new Report({
      idNumber,
      pydp,
      programName,
      objectives,
      startDate,
      budgetAllocated,
      budgetSpent,
      barangay: user.barangay._id,
      submittedBy,
    });

    await report.save();

    const io = req.app.get("io");
    const notificationId = `report_${report._id}`;
    const title = `New report submitted: ${report.programName}`;
    const subtitle = `By ${user.firstname} ${user.lastname} - ${user.barangay.barangayName}`;

    const adminUsers = await User.find({ role: "Admin" }).select(
      "_id firstname lastname email",
    );

    console.log("[DEBUG] Submitting report and notifying admins:", {
      reportId: report._id,
      adminCount: adminUsers.length,
      title,
      subtitle,
    });

    await Promise.all(
      adminUsers.map((admin) => {
        console.log("[DEBUG] Creating notification for admin:", {
          adminId: admin._id,
          adminEmail: admin.email,
          type: "report_submitted",
        });
        return createAndEmitNotification(
          io,
          admin._id,
          notificationId,
          "report_submitted",
          title,
          subtitle,
          {
            reportId: report._id,
            barangayId: user.barangay._id,
            submittedBy,
          },
        );
      }),
    );

    // Also emit a role-based event so all connected admins receive it immediately
    io.to("role-Admin").emit("new-notification", {
      id: notificationId,
      type: "report_submitted",
      title,
      subtitle,
      time: new Date(),
      seen: false,
      meta: {
        reportId: report._id,
        barangayId: user.barangay._id,
        submittedBy,
      },
    });

    res.status(201).json({ message: "Report submitted successfully", report });
  } catch (error) {
    console.error(error);
    if (error.code === 11000 && error.keyPattern?.idNumber) {
      return res.status(400).json({
        message:
          "Reference ID number already taken. Please use another Reference ID.",
      });
    }
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
      .populate("submittedBy", "firstname lastname")
      .sort({ submittedAt: -1 });

    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update admin validation status for a report
export const updateReportValidation = async (req, res) => {
  try {
    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { reportId } = req.params;
    const { validationStatus } = req.body;
    const allowed = ["valid", "not valid"];
    if (!allowed.includes(validationStatus)) {
      return res.status(400).json({ message: "Invalid validation status" });
    }

    let report = await Report.findByIdAndUpdate(
      reportId,
      { validationStatus },
      { new: true },
    );

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    report = await Report.findById(reportId)
      .populate("barangay", "barangayName")
      .populate("submittedBy", "firstname lastname");

    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
