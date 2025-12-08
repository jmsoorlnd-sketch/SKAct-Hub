import Message from "../models/MessageModel.js";
import User from "../models/UserModel.js";

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { recipientId, subject, body, startDate, endDate } = req.body;

    if (!recipientId || !subject || !body) {
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
    const message = await Message.create({
      sender: senderId,
      recipient: recipientId,
      subject,
      body,
      attachmentUrl,
      attachmentName,
      startDate: s,
      endDate: e,
      status: "pending",
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
    const messages = await Message.find({
      recipient: userId,
      isAttached: { $ne: true },
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
        status
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
      { new: true }
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

// Get all admin users (for sending messages to)
export const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "Admin" }).select(
      "_id username email"
    );

    res.status(200).json({ admins });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
