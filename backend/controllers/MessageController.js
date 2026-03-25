import Message from "../models/MessageModel.js";
import User from "../models/UserModel.js";
import UserLog from "../models/UserLogModel.js";
import BarangayStorage from "../models/BarangayStorageModel.js";
import Barangay from "../models/BarangayModel.js";
import Folder from "../models/FolderModel.js";
import ActivityUpdate from "../models/ActivityUpdateModel.js";
import Notification from "../models/NotificationModel.js";
// Send a message
export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const {
      recipientId,
      subject,
      body,
      startDate,
      endDate,
      recipient,
      status,
      barangayId,
    } = req.body;

    // For admin events, if recipient is "admin", find the first admin user
    let finalRecipientId = recipientId;
    if (recipient === "admin" && !recipientId) {
      const adminUser = await User.findOne({ role: "Admin" });
      if (!adminUser) {
        return res.status(400).json({ message: "No admin user found" });
      }
      finalRecipientId = adminUser._id;
    }

    if (!finalRecipientId || !subject || !body) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Attachment handling (multer adds `req.file`)
    let attachmentUrl = null;
    let attachmentName = null;
    if (req.file) {
      attachmentUrl = `/uploads/${req.file.filename}`;
      attachmentName = req.file.originalname;
    }

    // parse dates if provided
    let s = startDate ? new Date(startDate) : null;
    let e = endDate ? new Date(endDate) : null;

    // Create message
    // Mark as admin-scheduled if the sender is an admin and recipient is also an admin
    const senderUser = await User.findById(senderId);
    const isAdminEvent = senderUser?.role === "Admin";

    // Admin-scheduled events are automatically approved
    const messageStatus = isAdminEvent ? "approved" : status || "pending";

    const message = await Message.create({
      sender: senderId,
      recipient: finalRecipientId,
      subject,
      body,
      attachmentUrl,
      attachmentName,
      startDate: s,
      endDate: e,
      status: messageStatus,
      isAdminScheduled: isAdminEvent,
      attachedToBarangay: barangayId || null,
    });

    await message.populate("sender", "username email role");
    await message.populate("recipient", "username email role");

    // Send notifications to users if this is an admin-scheduled event
    if (isAdminEvent && message.startDate) {
      try {
        let targetUsers;

        if (barangayId) {
          // Only notify users in the specific barangay
          targetUsers = await User.find({
            barangay: barangayId,
            role: { $in: ["Youth", "Official"] }, // Only notify non-admin users
          });
        } else {
          // Notify all users
          targetUsers = await User.find({
            role: { $in: ["Youth", "Official"] }, // Only notify non-admin users
          });
        }

        // Create notification records for each user
        const notificationPromises = targetUsers.map((user) =>
          Notification.updateOne(
            { user: user._id, notificationId: message._id.toString() },
            {
              user: user._id,
              notificationId: message._id.toString(),
              type: "activity",
              seen: false,
            },
            { upsert: true },
          ),
        );

        await Promise.all(notificationPromises);
      } catch (notificationError) {
        console.error("Error creating notifications:", notificationError);
        // Don't fail the entire operation if notifications fail
      }
    }

    res.status(201).json({
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get inbox messages for logged-in user
export const getInbox = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    let query;

    if (user?.role === "Admin") {
      // Admins: exclude admin-scheduled events from inbox (they see them in calendar only)
      query = {
        recipient: userId,
        isAttached: { $ne: true },
        isAdminScheduled: { $ne: true },
        isDeleted: false,
      };
    } else {
      // Non-admins (Youth/Official): include admin-scheduled events relevant to them
      // Admin events are broadcast, not sent to individual users, so don't check recipient for them
      const orConditions = [
        // Admin-created events for all barangays - broadcast to all
        {
          isAdminScheduled: true,
          attachedToBarangay: null,
          isDeleted: false,
        },
      ];

      // If user has a barangay assigned, include events for their barangay
      if (user?.barangay) {
        orConditions.push(
          {
            isAdminScheduled: true,
            attachedToBarangay: user.barangay,
            isDeleted: false,
          },
          {
            // Include official-submitted events for their barangay (pending/approved/ongoing)
            attachedToBarangay: user.barangay,
            status: { $in: ["pending", "approved", "ongoing", "completed"] },
            isDeleted: false,
          },
        );
      }

      // Include events created by the user (so non-admin can see own submissions)
      orConditions.push({
        sender: userId,
        isDeleted: false,
      });

      query = {
        startDate: { $exists: true, $ne: null },
        isDeleted: false,
        $or: orConditions,
      };
    }

    const messages = await Message.find(query)
      .populate("sender", "username email role")
      .populate("intendedFolder", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      messages,
      total: messages.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update message status (approve / ongoing / rejected)
export const updateStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status } = req.body;

    if (
      ![
        "pending",
        "approved",
        "ongoing",
        "rejected",
        "completed",
        "cancelled",
      ].includes(status)
    ) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ message: "Message not found" });

    // Only the original sender can change the status (admins cannot)
    if (String(msg.sender) !== String(req.user._id)) {
      return res
        .status(403)
        .json({ message: "Only the message sender can update status" });
    }

    msg.status = status;
    await msg.save();
    await msg.populate("sender", "username email role");

    // Log user action for cancellations (and other status changes if desired)
    try {
      const actionType = status === "cancelled" ? "cancel_event" : "other";
      await UserLog.create({
        userId: req.user._id,
        username: req.user.username,
        firstname: req.user.firstname,
        lastname: req.user.lastname,
        barangayId: req.user.barangay,
        barangayName: req.user.barangayName,
        role: req.user.role,
        actionType,
        description:
          status === "cancelled"
            ? `User canceled event: "${msg.subject}"`
            : `User updated message status to ${status}: "${msg.subject}"`,
        ipAddress: req.ip || "Unknown",
        userAgent: req.get("user-agent") || "Unknown",
      });
    } catch (logError) {
      console.warn("Failed to log status update action:", logError);
    }

    res.status(200).json({ message: "Status updated", data: msg });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get activities that are approved or ongoing (for calendar)
// Get activities (filter by user's barangay for non-admins, show all for admins)
export const getActivities = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("barangay role");

    let query;

    if (user?.role === "Admin") {
      // Admins see all events with a startDate (including admin-scheduled events)
      query = {
        startDate: { $exists: true, $ne: null },
        isDeleted: false,
      };
    } else {
      // Non-admins see:
      // 1. Events for their specific barangay (admin or official events)
      // 2. Events they created
      // 3. Admin-created events for all barangays (broadcast events)
      const orConditions = [
        // Admin-created events for all barangays (broadcast)
        {
          attachedToBarangay: null,
          isAdminScheduled: true,
          isDeleted: false,
        },
      ];

      if (user?.barangay) {
        // Admin-scheduled to this barangay
        orConditions.push({
          attachedToBarangay: user.barangay,
          isAdminScheduled: true,
          isDeleted: false,
        });

        // Non-admin events for this barangay (pending/approved/ongoing/completed)
        orConditions.push({
          attachedToBarangay: user.barangay,
          status: { $in: ["pending", "approved", "ongoing", "completed"] },
          isDeleted: false,
        });
      }

      // Events created by the user (sender), regardless of attachedToBarangay (useful for draft/resubmitted)
      orConditions.push({
        sender: userId,
        isDeleted: false,
      });

      query = {
        startDate: { $exists: true, $ne: null },
        isDeleted: false,
        $or: orConditions,
      };
    }

    const activities = await Message.find(query)
      .populate("sender", "username email role")
      .sort({ startDate: 1 });

    res.status(200).json({ activities });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch activities", error: error.message });
  }
};

// Get messages sent by the logged-in user
export const getSentMessages = async (req, res) => {
  try {
    const userId = req.user._id;

    const messages = await Message.find({ sender: userId, isDeleted: false })
      .populate("recipient", "username email role")
      .populate("attachedToBarangay", "barangayName city province")
      .sort({ createdAt: -1 });

    res.status(200).json({ messages, total: messages.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get messages sent by a specific user (for admin view of user profile)
export const getMessagesByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await Message.find({ sender: userId, isDeleted: false })
      .populate("recipient", "username email role")
      .populate("sender", "username email role")
      .sort({ createdAt: -1 });

    res.status(200).json({ messages, total: messages.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark message as read
export const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findByIdAndUpdate(
      messageId,
      { isRead: true },
      { new: true },
    ).populate("sender", "username email");

    res.status(200).json({
      message: "Message marked as read",
      data: message,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    // ensure the message exists and the requester is the original sender
    const msg = await Message.findById(messageId);
    if (!msg) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (String(msg.sender) !== String(req.user._id)) {
      return res
        .status(403)
        .json({ message: "Only the message sender can delete this item" });
    }

    // Soft delete message
    msg.isDeleted = true;
    msg.deletedAt = new Date();
    msg.deletedBy = req.user._id;
    await msg.save();

    // Also mark stored copies (if any) as deleted
    await BarangayStorage.updateMany(
      { document: messageId },
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: req.user._id,
      },
    );

    // Log the action
    try {
      await UserLog.create({
        userId: req.user._id,
        username: req.user.username,
        firstname: req.user.firstname,
        lastname: req.user.lastname,
        barangayId: req.user.barangay,
        role: req.user.role,
        actionType: "delete_message",
        description: `Deleted message with subject: ${msg.subject}`,
        ipAddress: req.ip || "Unknown",
        userAgent: req.get("user-agent") || "Unknown",
      });
    } catch (logError) {
      console.error("Error logging delete message action:", logError);
    }

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Restore a soft-deleted message
export const restoreMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const msg = await Message.findById(messageId);
    if (!msg) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (String(msg.sender) !== String(req.user._id)) {
      return res
        .status(403)
        .json({ message: "Only the message sender can restore this item" });
    }

    if (!msg.isDeleted) {
      return res.status(400).json({ message: "Message is not deleted" });
    }

    msg.isDeleted = false;
    msg.deletedAt = null;
    msg.deletedBy = null;
    await msg.save();

    await BarangayStorage.updateMany(
      { document: messageId },
      {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
      },
    );

    res.status(200).json({ message: "Message restored successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Hard delete a message
export const hardDeleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const msg = await Message.findById(messageId);
    if (!msg) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (String(msg.sender) !== String(req.user._id)) {
      return res
        .status(403)
        .json({ message: "Only the message sender can hard delete this item" });
    }

    await Message.findByIdAndDelete(messageId);
    await BarangayStorage.deleteMany({ document: messageId });

    res.status(200).json({ message: "Message permanently deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin approves a message from an official and stores it to barangay storage
export const approveMessageForBarangay = async (req, res) => {
  try {
    const { messageId } = req.body;

    if (!messageId) {
      return res.status(400).json({ message: "messageId is required" });
    }

    // Get the message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Get the target barangay from the message
    let barangayId = message.attachedToBarangay;

    // Fallback: if no attachedToBarangay, try to get from sender's barangay
    if (!barangayId && message.sender) {
      const sender = await User.findById(message.sender);
      if (sender && sender.barangay) {
        barangayId = sender.barangay;
      }
    }

    if (!barangayId) {
      return res
        .status(400)
        .json({ message: "No target barangay specified for this message" });
    }

    // Update message status to approved
    message.status = "approved";
    message.isAttached = true;
    message.attachedToBarangay = barangayId;
    await message.save();

    // Log the approval action
    const adminUser = await User.findById(req.user._id);
    const barangay = await Barangay.findById(barangayId);
    try {
      await UserLog.create({
        userId: req.user._id,
        username: adminUser?.username,
        firstname: adminUser?.firstname,
        lastname: adminUser?.lastname,
        barangayId: barangayId,
        barangayName: barangay?.barangayName,
        role: adminUser?.role,
        actionType: "approve_message",
        description: `Admin approved message: "${message.subject}" from ${adminUser?.username}`,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
    } catch (logError) {
      console.warn("Failed to log message approval:", logError);
    }

    // Store the message to BarangayStorage
    const storageData = {
      barangay: barangayId,
      document: messageId,
      uploadedBy: message.sender,
      documentName: message.subject,
      description: message.body,
    };

    // If message has an intended folder, add it to storage
    if (message.intendedFolder) {
      storageData.folder = message.intendedFolder;
    }

    const storage = await BarangayStorage.create(storageData);

    // automatically move folder to ongoing if this is the first document stored
    if (storage.folder) {
      try {
        const folder = await Folder.findById(storage.folder);
        if (folder && folder.status === "pending") {
          folder.status = "ongoing";
          await folder.save();
        }
      } catch (err) {
        console.warn("Failed to auto-update folder status:", err);
      }
    }

    await storage.populate("barangay");
    await storage.populate("document");
    await storage.populate("uploadedBy", "username email");

    res.status(201).json({
      message:
        "Message approved and stored to barangay" +
        (message.intendedFolder ? " in designated folder" : ""),
      data: storage,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin rejects a message from an official
export const rejectMessage = async (req, res) => {
  try {
    const { messageId, reason } = req.body;

    if (!messageId) {
      return res.status(400).json({ message: "messageId is required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Update message status to rejected and store the reason
    message.status = "rejected";
    message.rejectionReason = reason ? reason.trim() : "No reason provided";
    await message.save();
    await message.populate("sender", "username email role");

    // Log the rejection action
    const adminUser = await User.findById(req.user._id);
    try {
      await UserLog.create({
        userId: req.user._id,
        username: adminUser?.username,
        firstname: adminUser?.firstname,
        lastname: adminUser?.lastname,
        barangayId: adminUser?.barangay,
        barangayName: adminUser?.barangayName,
        role: adminUser?.role,
        actionType: "reject_message",
        description: `Admin rejected message: "${message.subject}" from ${message.sender?.username}`,
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });
    } catch (logError) {
      console.warn("Failed to log message rejection:", logError);
    }

    res.status(200).json({
      message: "Message rejected",
      data: message,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all admin users (for sending messages to)
export const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "Admin" }).select(
      "_id username email",
    );

    res.status(200).json({ admins });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Upload activity photo update (Officials only)
export const uploadActivityUpdate = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { barangayId, caption } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Only officials can upload activity photos
    if (userRole !== "Official") {
      return res
        .status(403)
        .json({ message: "Only officials can upload activity photos" });
    }

    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ message: "Photo file is required" });
    }

    // Verify document exists
    const document = await Message.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Verify barangay exists
    const barangay = await Barangay.findById(barangayId);
    if (!barangay) {
      return res.status(404).json({ message: "Barangay not found" });
    }

    // Create activity update
    const activityUpdate = new ActivityUpdate({
      document: documentId,
      barangay: barangayId,
      uploadedBy: userId,
      photoUrl: `/uploads/${req.file.filename}`,
      photoName: req.file.originalname,
      caption: caption || "",
    });

    await activityUpdate.save();
    await activityUpdate.populate("uploadedBy", "firstname lastname username");

    res.status(201).json({
      message: "Activity photo uploaded successfully",
      activityUpdate,
    });
  } catch (error) {
    console.error("Error uploading activity update:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get activity updates for a document
export const getActivityUpdates = async (req, res) => {
  try {
    const { documentId } = req.params;

    const updates = await ActivityUpdate.find({ document: documentId })
      .populate("uploadedBy", "firstname lastname username")
      .sort({ createdAt: -1 });

    res.status(200).json({ updates });
  } catch (error) {
    console.error("Error fetching activity updates:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete activity update (Official who uploaded it only)
export const deleteActivityUpdate = async (req, res) => {
  try {
    const { updateId } = req.params;
    const userId = req.user._id;

    const update = await ActivityUpdate.findById(updateId);
    if (!update) {
      return res.status(404).json({ message: "Activity update not found" });
    }

    // Only the official who uploaded it can delete
    if (String(update.uploadedBy) !== String(userId)) {
      return res
        .status(403)
        .json({ message: "You can only delete your own updates" });
    }

    await ActivityUpdate.findByIdAndDelete(updateId);

    res.status(200).json({ message: "Activity update deleted successfully" });
  } catch (error) {
    console.error("Error deleting activity update:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
