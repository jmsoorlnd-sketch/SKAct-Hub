import UserLog from "../models/UserLogModel.js";

export const logUserActionAsync = async (
  userId,
  actionType,
  description,
  req,
) => {
  try {
    await UserLog.create({
      userId,
      actionType,
      description,
      ipAddress: req?.ip || "Unknown",
      userAgent: req?.get?.("user-agent") || "Unknown",
    });
  } catch (error) {
    console.error("Error logging user action:", error);
    // Don't throw - logging shouldn't break the main action
  }
};

export const logAction = async (
  userId,
  username,
  firstname,
  lastname,
  barangayId,
  role,
  actionType,
  description,
  req,
) => {
  try {
    await UserLog.create({
      userId,
      username,
      firstname,
      lastname,
      barangayId,
      role,
      actionType,
      description,
      ipAddress: req?.ip || "Unknown",
      userAgent: req?.get?.("user-agent") || "Unknown",
    });
  } catch (error) {
    console.error("Error logging action:", error);
  }
};
