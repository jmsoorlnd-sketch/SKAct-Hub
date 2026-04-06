import Notification from "../models/NotificationModel.js";

// Helper function to emit notification to user
const emitNotification = (io, userId, notification) => {
  io.to(`user-${userId}`).emit("new-notification", notification);
};

// Mark a notification as seen
export const markNotificationAsSeen = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { user: userId, notificationId },
      { seen: true },
      { new: true, upsert: false },
    );

    // Emit update to user
    const io = req.app.get("io");
    io.to(`user-${userId}`).emit("notification-status-updated", {
      notificationId,
      seen: true,
    });

    res.status(200).json({
      message: "Notification marked as seen",
      data: notification,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark a notification as unseen
export const markNotificationAsUnseen = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { user: userId, notificationId },
      { seen: false },
      { new: true, upsert: false },
    );

    // Emit update to user
    const io = req.app.get("io");
    io.to(`user-${userId}`).emit("notification-status-updated", {
      notificationId,
      seen: false,
    });

    res.status(200).json({
      message: "Notification marked as unseen",
      data: notification,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark all notifications as seen
export const markAllNotificationsAsSeen = async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.updateMany(
      { user: userId },
      { seen: true },
    );

    // Emit update to user
    const io = req.app.get("io");
    io.to(`user-${userId}`).emit("all-notifications-seen");

    res.status(200).json({
      message: "All notifications marked as seen",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all notification seen statuses for current user
export const getNotificationSeenStatus = async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({ user: userId }).select(
      "notificationId seen",
    );

    // Convert to map for easier lookup
    const seenMap = {};
    notifications.forEach((n) => {
      seenMap[n.notificationId] = n.seen;
    });

    res.status(200).json({
      seenStatuses: seenMap,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Batch mark notifications as seen
export const batchMarkNotificationsAsSeen = async (req, res) => {
  try {
    const { notificationIds } = req.body;
    const userId = req.user._id;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res
        .status(400)
        .json({ message: "notificationIds array required" });
    }

    const result = await Notification.updateMany(
      { user: userId, notificationId: { $in: notificationIds } },
      { seen: true },
    );

    // Emit update for each notification
    const io = req.app.get("io");
    notificationIds.forEach((notificationId) => {
      io.to(`user-${userId}`).emit("notification-status-updated", {
        notificationId,
        seen: true,
      });
    });

    res.status(200).json({
      message: "Notifications marked as seen",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all notifications for current user
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .lean();

    const validNotifications = notifications.filter(
      (notification) =>
        notification?.type && notification?.title && notification?.subtitle,
    );

    res.status(200).json({
      notifications: validNotifications.map((notification) => ({
        id: notification.notificationId,
        type: notification.type,
        title: notification.title,
        subtitle: notification.subtitle,
        time: notification.createdAt,
        seen: notification.seen,
        meta: notification.metadata,
      })),
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: error.message });
  }
};

// Create and emit notification (utility function)
// In NotificationController.js - ensure this function exists and is exported
export const createAndEmitNotification = async (
  io,
  userId,
  notificationId,
  type,
  title,
  subtitle,
  metadata = {},
) => {
  try {
    console.log("[DEBUG] createAndEmitNotification called:", {
      userId,
      notificationId,
      type,
      title,
      subtitle,
    });

    // Create/update notification in database
    const notification = await Notification.findOneAndUpdate(
      { user: userId, notificationId },
      {
        type,
        title,
        subtitle,
        metadata,
        seen: false,
        createdAt: new Date(),
      },
      { upsert: true, new: true },
    );

    console.log("[DEBUG] Notification saved to DB:", {
      savedNotificationId: notification._id,
      user: notification.user,
      type: notification.type,
    });

    // Emit real-time notification to user's room
    io.to(`user-${userId}`).emit("new-notification", {
      id: notificationId,
      type,
      title,
      subtitle,
      time: new Date(),
      seen: false,
      meta: metadata,
    });

    console.log(
      "[DEBUG] Emitted real-time notification to user room:",
      `user-${userId}`,
    );

    return notification;
  } catch (error) {
    console.error("[ERROR] Error creating notification:", error);
    return null;
  }
};
