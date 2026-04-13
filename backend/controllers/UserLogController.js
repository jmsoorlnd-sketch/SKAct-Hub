import UserLog from "../models/UserLogModel.js";
import User from "../models/userModel.js";

/**
 * @desc Log user action
 */
export const logUserAction = async (req, res) => {
  try {
    const {
      actionType,
      description,
      ipAddress,
      userAgent,
      userId,
      barangayId,
    } = req.body;

    if (!actionType) {
      return res.status(400).json({ message: "Action type is required" });
    }

    const user = await User.findById(userId || req.user._id).select(
      "username firstname lastname role barangay",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newLog = await UserLog.create({
      userId: user._id,
      username: user.username,
      firstname: user.firstname,
      lastname: user.lastname,
      barangayId: barangayId || user.barangayName?._id,
      role: user.role,
      actionType,
      description: description || "",
      ipAddress: ipAddress || req.ip || "Unknown",
      userAgent: userAgent || req.get("user-agent") || "Unknown",
    });

    res.status(201).json({
      message: "Log created successfully",
      log: newLog,
    });
  } catch (error) {
    console.error("Log User Action error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc Get all user logs (admin only)
 */
export const getAllUserLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      actionType,
      userId,
      barangayId,
      startDate,
      endDate,
    } = req.query;

    const query = {};

    if (actionType) query.actionType = actionType;
    if (userId) query.userId = userId;
    if (barangayId) query.barangayId = barangayId;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const logs = await UserLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("userId", "username firstname lastname")
      .populate("barangayId", "barangayName");

    const count = await UserLog.countDocuments(query);

    res.status(200).json({
      logs,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalLogs: count,
    });
  } catch (error) {
    console.error("Get All User Logs error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc Get logs by user
 */
export const getLogsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const logs = await UserLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("userId", "username firstname lastname");

    const count = await UserLog.countDocuments({ userId });

    res.status(200).json({
      logs,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalLogs: count,
    });
  } catch (error) {
    console.error("Get Logs By User error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc Get logs by barangay
 */
export const getLogsByBarangay = async (req, res) => {
  try {
    const { barangayId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const logs = await UserLog.find({ barangayId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("userId", "username firstname lastname");

    const count = await UserLog.countDocuments({ barangayId });

    res.status(200).json({
      logs,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalLogs: count,
    });
  } catch (error) {
    console.error("Get Logs By Barangay error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc Get logs by action type
 */
export const getLogsByActionType = async (req, res) => {
  try {
    const { actionType } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const logs = await UserLog.find({ actionType })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("userId", "username firstname lastname");

    const count = await UserLog.countDocuments({ actionType });

    res.status(200).json({
      logs,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalLogs: count,
    });
  } catch (error) {
    console.error("Get Logs By Action Type error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc Get log statistics
 */
export const getLogStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Count by action type
    const actionTypeCounts = await UserLog.aggregate([
      { $match: query },
      { $group: { _id: "$actionType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Total logs
    const totalLogs = await UserLog.countDocuments(query);

    // Logs by a (top 10 users)
    const topUsers = await UserLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$userId",
          username: { $first: "$username" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.status(200).json({
      totalLogs,
      actionTypeCounts,
      topUsers,
    });
  } catch (error) {
    console.error("Get Log Statistics error:", error);
    res.status(500).json({ error: error.message });
  }
};
