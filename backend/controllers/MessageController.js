import Message from "../models/MessageModel.js";
import User from "../models/UserModel.js";
import UserLog from "../models/UserLogModel.js";
import BarangayStorage from "../models/BarangayStorageModel.js";
import Barangay from "../models/BarangayModel.js";
import Folder from "../models/FolderModel.js";
import ActivityUpdate from "../models/ActivityUpdateModel.js";
import Notification from "../models/NotificationModel.js";
import { createAndEmitNotification } from "./NotificationController.js";

// Helper function to get io instance
const getIO = (req) => {
  return req.app.get("io");
};

// Update sendMessage function
export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const {
      recipientId,
      subject,
      body,
      startDate,
      endDate,
      participants,
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

    const now = new Date();
    if (s && s < now) {
      return res
        .status(400)
        .json({ message: "Start date/time cannot be in the past" });
    }
    if (e && e < now) {
      return res
        .status(400)
        .json({ message: "End date/time cannot be in the past" });
    }
    if (s && e && e < s) {
      return res
        .status(400)
        .json({ message: "End date/time cannot be before start date/time" });
    }

    if (s) {
      const conflictingEvent = await Message.findOne({
        isDeleted: false,
        startDate: { $lte: e || s },
        $or: [
          { endDate: null },
          { endDate: { $exists: false } },
          { endDate: { $gte: s } },
        ],
      });

      if (conflictingEvent) {
        const overlapping =
          s &&
          (!conflictingEvent.endDate || conflictingEvent.endDate >= s) &&
          (!e || conflictingEvent.startDate <= e);

        if (overlapping && (!participants || participants.length === 0)) {
          return res.status(400).json({
            message: "Event conflict detected; please add participant names.",
          });
        }
      }
    }

    // Create message
    const senderUser = await User.findById(senderId);
    const isAdminEvent = senderUser?.role === "Admin";
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
      participants: Array.isArray(participants)
        ? participants.filter((p) => p && p.trim())
        : typeof participants === "string"
          ? participants
              .split(",")
              .map((p) => p.trim())
              .filter(Boolean)
          : [],
      status: messageStatus,
      isAdminScheduled: isAdminEvent,
      attachedToBarangay: barangayId || null,
    });

    await message.populate("sender", "username email role");
    await message.populate("recipient", "username email role");

    // Get io instance and emit real-time events
    const io = getIO(req);

    // Emit to recipient if it's a direct message
    if (!isAdminEvent) {
      io.to(`user-${finalRecipientId}`).emit("new-message", {
        message: "You have a new message",
        data: message,
        type: "direct",
      });

      // If the direct message is pending and meant for an admin, create a pending document notification.
      if (messageStatus === "pending") {
        const recipientUser = await User.findById(finalRecipientId).select(
          "_id username firstname lastname role position",
        );

        if (recipientUser?.role === "Admin") {
          const notificationTitle = `📄 New Document Pending: ${message.subject}`;
          const notificationSubtitle = `From: ${senderUser.firstname || senderUser.username} ${senderUser.lastname || ""} (${senderUser.position || senderUser.role || "Official"})`;

          console.log(
            "[DEBUG] Creating notification for direct pending message:",
            {
              adminId: finalRecipientId,
              type: "message_pending",
              title: notificationTitle,
              subtitle: notificationSubtitle,
            },
          );

          await createAndEmitNotification(
            io,
            finalRecipientId,
            message._id.toString(),
            "message_pending",
            notificationTitle,
            notificationSubtitle,
            {
              messageId: message._id,
              senderId,
              barangayId,
            },
          );

          io.to("role-Admin").emit("new-notification", {
            id: message._id.toString(),
            type: "message_pending",
            title: notificationTitle,
            subtitle: notificationSubtitle,
            time: new Date(),
            seen: false,
            meta: {
              messageId: message._id,
              senderId,
              barangayId,
            },
          });
        }
      }
    }

    // If it's an admin event, notify all relevant users with real-time notifications
    if (isAdminEvent && message.startDate) {
      try {
        let targetUsers;
        if (barangayId) {
          targetUsers = await User.find({
            barangay: barangayId,
            role: { $in: ["Youth", "Official"] },
          });
          // Emit to barangay room
          io.to(`barangay-${barangayId}`).emit("new-activity", {
            message: "New activity scheduled for your barangay",
            data: message,
            type: "barangay-activity",
          });
        } else {
          targetUsers = await User.find({
            role: { $in: ["Youth", "Official"] },
          });
          // Broadcast to all users
          io.emit("new-activity", {
            message: "New activity scheduled",
            data: message,
            type: "global-activity",
          });
        }

        // Create real-time notifications for each user
        for (const user of targetUsers) {
          await createAndEmitNotification(
            io,
            user._id,
            message._id.toString(),
            "activity",
            `New Activity: ${message.subject}`,
            `Scheduled for ${new Date(message.startDate).toLocaleDateString()}`,
            { activityId: message._id },
          );
        }
      } catch (notificationError) {
        console.error("Error creating notifications:", notificationError);
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

// Update updateStatus function with real-time events
// Add this function to MessageController.js
export const updateStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status, reason } = req.body;

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

    if (
      String(msg.sender) !== String(req.user._id) &&
      req.user.role !== "Admin"
    ) {
      return res
        .status(403)
        .json({ message: "Only the sender or an admin can update status" });
    }

    const oldStatus = msg.status;
    msg.status = status;

    // Add rejection reason if provided
    if (status === "rejected" && reason) {
      msg.rejectionReason = reason;
    }

    await msg.save();
    await msg.populate("sender", "username email role firstname lastname");
    await msg.populate("recipient", "username email role");

    const io = req.app.get("io");

    const statusUpdateData = {
      messageId: msg._id,
      status: status,
      oldStatus: oldStatus,
      rejectionReason: msg.rejectionReason || null,
      message: `Your message "${msg.subject}" status changed from ${oldStatus} to ${status}`,
      data: msg,
    };

    // Emit to sender
    io.to(`user-${msg.sender._id}`).emit(
      "message-status-updated",
      statusUpdateData,
    );

    // Emit to recipient if different
    if (msg.recipient && String(msg.recipient._id) !== String(msg.sender._id)) {
      io.to(`user-${msg.recipient._id}`).emit(
        "message-status-updated",
        statusUpdateData,
      );
    }

    // Create notification for the sender
    await createAndEmitNotification(
      io,
      msg.sender._id,
      msg._id.toString(),
      status === "approved"
        ? "message_approved"
        : status === "rejected"
          ? "message_rejected"
          : "message_updated",
      `Message ${status}: ${msg.subject}`,
      `Your message has been ${status}${status === "rejected" && msg.rejectionReason ? `: ${msg.rejectionReason}` : ""}`,
      { messageId: msg._id, status: status },
    );

    res.status(200).json({ message: "Status updated", data: msg });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ error: error.message });
  }
};
// Update the approveMessageForBarangay function (already in your MessageController.js)
// Make sure it's emitting to the sender
export const approveMessageForBarangay = async (req, res) => {
  try {
    const { messageId } = req.body;

    if (!messageId) {
      return res.status(400).json({ message: "messageId is required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    let barangayId = message.attachedToBarangay;

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

    message.status = "approved";
    message.isAttached = true;
    message.attachedToBarangay = barangayId;
    await message.save();

    const io = req.app.get("io");
    const barangay = await Barangay.findById(barangayId);

    // ===== NOTIFY THE ORIGINAL SENDER THAT THEIR DOCUMENT WAS APPROVED =====
    await createAndEmitNotification(
      io,
      message.sender,
      messageId,
      "message_approved",
      `✅ Document Approved: ${message.subject}`,
      `Your document has been approved and stored in ${barangay.barangayName}`,
      { messageId: messageId, barangayId: barangayId },
    );

    // Notify all barangay members about new document
    const barangayUsers = await User.find({ barangay: barangayId });
    for (const user of barangayUsers) {
      // Skip the sender if they're already notified above
      if (String(user._id) !== String(message.sender)) {
        await createAndEmitNotification(
          io,
          user._id,
          messageId,
          "barangay_ongoing",
          `📄 New Document: ${message.subject}`,
          `Added to ${barangay.barangayName}`,
          { barangayId: barangayId, messageId: messageId },
        );
      }
    }

    // Also emit to barangay room
    io.to(`barangay-${barangayId}`).emit("document-approved", {
      message: `New document "${message.subject}" has been added`,
      document: message,
    });

    // ... rest of your existing code (storage creation, logging, etc.)

    const storageData = {
      barangay: barangayId,
      document: messageId,
      uploadedBy: message.sender,
      documentName: message.subject,
      description: message.body,
    };

    if (message.intendedFolder) {
      storageData.folder = message.intendedFolder;
    }

    const storage = await BarangayStorage.create(storageData);

    if (storage.folder) {
      try {
        const folder = await Folder.findById(storage.folder);
        if (folder && folder.status === "pending") {
          folder.status = "ongoing";
          await folder.save();

          // Notify about folder status update
          io.to(`barangay-${barangayId}`).emit("folder-updated", {
            message: `Folder "${folder.name}" status updated to ongoing`,
            folder: folder,
          });
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
    console.error("Error approving message:", error);
    res.status(500).json({ error: error.message });
  }
};
export const uploadActivityUpdate = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { barangayId, caption } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    if (userRole !== "Official") {
      return res
        .status(403)
        .json({ message: "Only officials can upload activity photos" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Photo file is required" });
    }

    const document = await Message.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const barangay = await Barangay.findById(barangayId);
    if (!barangay) {
      return res.status(404).json({ message: "Barangay not found" });
    }

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

    const io = getIO(req);

    // Notify barangay members about new activity update
    io.to(`barangay-${barangayId}`).emit("new-activity-update", {
      message: `New activity update for "${document.subject}"`,
      data: activityUpdate,
      document: document,
    });

    res.status(201).json({
      message: "Activity photo uploaded successfully",
      activityUpdate,
    });
  } catch (error) {
    console.error("Error uploading activity update:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get inbox messages for logged-in user
export const getInbox = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    let query;

    if (user?.role === "Admin") {
      // Admins: see both direct messages AND all pending documents for storage approval
      query = {
        $or: [
          // Direct messages to this admin
          {
            recipient: userId,
            isAttached: { $ne: true },
            isAdminScheduled: { $ne: true },
            isDeleted: false,
          },
          // Official documents that were created for approval, including pending/rejected
          // Exclude event/activity messages by requiring no startDate.
          {
            status: { $in: ["pending", "rejected"] },
            isAdminScheduled: { $ne: true },
            $and: [
              {
                $or: [{ startDate: { $exists: false } }, { startDate: null }],
              },
              {
                $or: [
                  { intendedFolder: { $exists: true, $ne: null } },
                  { attachedToBarangay: { $exists: true, $ne: null } },
                ],
              },
            ],
            isDeleted: false,
          },
        ],
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

// Get activities that are approved or ongoing (for calendar)
// Get activities (filter by user's barangay for non-admins, show all for admins)
// Add this function to MessageController.js
export const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "Admin" }).select(
      "_id username email firstname lastname",
    );

    res.status(200).json({ admins });
  } catch (error) {
    console.error("Error fetching admins:", error);
    res.status(500).json({ error: error.message });
  }
};
export const getActivities = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("barangay role");
    const includeCancelled = req.query.includeCancelled === "true";

    let query;

    // Auto-complete past events (for all users): approved/ongoing events whose endDate is in the past
    const now = new Date();
    await Message.updateMany(
      {
        endDate: { $lt: now },
        status: { $in: ["approved", "ongoing"] },
        isDeleted: false,
      },
      { status: "completed" },
    );

    if (user?.role === "Admin") {
      // Admins see all events with a startDate
      if (includeCancelled) {
        query = {
          startDate: { $exists: true, $ne: null },
        };
      } else {
        query = {
          startDate: { $exists: true, $ne: null },
          isDeleted: false,
          status: { $ne: "cancelled" },
        };
      }
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

        if (includeCancelled) {
          // include cancelled and deleted events in barangay scope
          orConditions.push({
            attachedToBarangay: user.barangay,
            status: "cancelled",
          });
          orConditions.push({
            attachedToBarangay: user.barangay,
            isDeleted: true,
          });
        }
      }

      // Events created by the user (sender), regardless of attachedToBarangay (useful for draft/resubmitted)
      orConditions.push({
        sender: userId,
        isDeleted: false,
      });

      if (includeCancelled) {
        orConditions.push({ sender: userId, status: "cancelled" });
        orConditions.push({ sender: userId, isDeleted: true });
        if (user?.barangay) {
          orConditions.push({
            attachedToBarangay: user.barangay,
            status: "cancelled",
          });
          orConditions.push({
            attachedToBarangay: user.barangay,
            isDeleted: true,
          });
        }
      }

      if (includeCancelled) {
        query = {
          startDate: { $exists: true, $ne: null },
          $or: orConditions,
        };
      } else {
        query = {
          startDate: { $exists: true, $ne: null },
          isDeleted: false,
          $or: orConditions,
        };
      }
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

    if (
      String(msg.sender) !== String(req.user._id) &&
      req.user.role !== "Admin"
    ) {
      return res
        .status(403)
        .json({ message: "Only the sender or an admin can delete this item" });
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
      // Determine if this is an event or document
      const isEvent = msg.startDate || msg.isAdminScheduled;

      await UserLog.create({
        userId: req.user._id,
        username: req.user.username,
        firstname: req.user.firstname,
        lastname: req.user.lastname,
        barangayId: req.user.barangay,
        role: req.user.role,
        actionType: isEvent ? "delete_event" : "delete_message",
        description: isEvent
          ? `Deleted event with subject: ${msg.subject}`
          : `Deleted message with subject: ${msg.subject}`,
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

// Permanent deletion of events with cascading removal from all barangay storaged
export const hardDeleteEvent = async (req, res) => {
  try {
    const { messageId } = req.params;

    const msg = await Message.findById(messageId);
    if (!msg) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if it's actually an event
    const isEvent = msg.startDate || msg.isAdminScheduled;
    if (!isEvent) {
      return res.status(400).json({ message: "This is not an event" });
    }

    // Only sender or admin can delete
    if (
      String(msg.sender) !== String(req.user._id) &&
      req.user.role !== "Admin"
    ) {
      return res.status(403).json({
        message:
          "Only the event organizer or admin can permanently delete this event",
      });
    }

    // Get event details before deletion for logging
    const eventSubject = msg.subject;
    const eventStart = msg.startDate;

    // Permanently delete the message
    await Message.findByIdAndDelete(messageId);

    // Cascade: remove from all barangay storage entries
    await BarangayStorage.deleteMany({ document: messageId });

    // Log the permanent deletion action
    try {
      await UserLog.create({
        userId: req.user._id,
        username: req.user.username,
        firstname: req.user.firstname,
        lastname: req.user.lastname,
        barangayId: req.user.barangay,
        role: req.user.role,
        actionType: "permanently_deleted_event",
        description: `Permanently deleted event: ${eventSubject} (${new Date(eventStart).toLocaleDateString()})`,
        ipAddress: req.ip || "Unknown",
        userAgent: req.get("user-agent") || "Unknown",
      });
    } catch (logError) {
      console.error("Error logging permanent event deletion:", logError);
    }

    res
      .status(200)
      .json({ message: "Event permanently deleted from all storage" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin approves a message from an official and stores it to barangay storage

// Admin rejects a message from an official
// Update the rejectMessage function
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

    // Reject only with non-empty reason
    const trimmedReason = reason ? reason.trim() : "";
    if (!trimmedReason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    message.status = "rejected";
    message.rejectionReason = trimmedReason;
    await message.save();
    await message.populate("sender", "username email role firstname lastname");

    const io = req.app.get("io");

    // ===== NOTIFY THE SENDER THAT THEIR DOCUMENT WAS REJECTED =====
    await createAndEmitNotification(
      io,
      message.sender._id,
      messageId,
      "message_rejected",
      `❌ Document Rejected: ${message.subject}`,
      `Reason: ${trimmedReason}`,
      { messageId: messageId, rejectionReason: trimmedReason },
    );

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
// Delete activity update (Official who uploaded it only)
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
