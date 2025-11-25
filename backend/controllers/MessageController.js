import Message from "../models/MessageModel.js";
import User from "../models/UserModel.js";

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { recipientId, subject, body, attachmentName } = req.body;

    if (!recipientId || !subject || !body) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Create message
    const message = await Message.create({
      sender: senderId,
      recipient: recipientId,
      subject,
      body,
      attachmentName,
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

    const messages = await Message.find({ recipient: userId })
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
