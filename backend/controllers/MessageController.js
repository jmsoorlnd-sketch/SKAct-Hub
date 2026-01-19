import Message from "../models/MessageModel.js";
import User from "../models/UserModel.js";
import BarangayStorage from "../models/BarangayStorageModel.js";
import Barangay from "../models/BarangayModel.js";

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

    // Exclude messages that have already been attached/moved into a barangay
    // Also exclude admin-scheduled events (they only appear in the calendar)
    const messages = await Message.find({
      recipient: userId,
      isAttached: { $ne: true },
      isAdminScheduled: { $ne: true },
    })
      .populate("sender", "username email role")
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
      !["pending", "approved", "ongoing", "rejected", "completed"].includes(
        status,
      )
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

    res.status(200).json({ message: "Status updated", data: msg });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get activities that are approved or ongoing (for calendar)
export const getActivities = async (req, res) => {
  try {
    const activities = await Message.find({
      status: { $in: ["approved", "ongoing"] },
      startDate: { $exists: true },
    })
      .populate("sender", "username email role")
      .sort({ startDate: 1 });

    res.status(200).json({ activities });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get messages sent by the logged-in user
export const getSentMessages = async (req, res) => {
  try {
    const userId = req.user._id;

    const messages = await Message.find({ sender: userId })
      .populate("recipient", "username email role")
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

    const messages = await Message.find({ sender: userId })
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

    await Message.findByIdAndDelete(messageId);

    res.status(200).json({ message: "Message deleted successfully" });
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

    // Store the message to BarangayStorage
    const storage = await BarangayStorage.create({
      barangay: barangayId,
      document: messageId,
      uploadedBy: message.sender,
      documentName: message.subject,
      description: message.body,
    });

    await storage.populate("barangay");
    await storage.populate("document");
    await storage.populate("uploadedBy", "username email");

    res.status(201).json({
      message: "Message approved and stored to barangay",
      data: storage,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin rejects a message from an official
export const rejectMessage = async (req, res) => {
  try {
    const { messageId } = req.body;

    if (!messageId) {
      return res.status(400).json({ message: "messageId is required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Update message status to rejected
    message.status = "rejected";
    await message.save();
    await message.populate("sender", "username email role");

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
