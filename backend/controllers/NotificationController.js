import Notification from "../models/NotificationModel.js";

// Mark a notification as seen
export const markNotificationAsSeen = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { user: userId, notificationId },
      { seen: true },
      { new: true, upsert: true },
    );

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
      { new: true, upsert: true },
    );

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

    res.status(200).json({
      message: "Notifications marked as seen",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
