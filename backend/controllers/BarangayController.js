import Barangay from "../models/BarangayModel.js";
import User from "../models/UserModel.js";
import BarangayStorage from "../models/BarangayStorageModel.js";
import Message from "../models/MessageModel.js";
import Folder from "../models/FolderModel.js";
import mongoose from "mongoose";

// GET /api/admins/officials/:barangayId
export const getOfficialsByBarangay = async (req, res) => {
  try {
    const { id } = req.params;

    const officials = await User.find({
      barangay: id,
      role: "Official",
    }).select("firstname lastname position status profileImage email");

    console.log("Officials fetched:", officials); // Moved to correct position

    res.status(200).json({ officials });
  } catch (error) {
    console.error("Error fetching officials:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//get barangay by id

export const getBarangayById = async (req, res) => {
  try {
    const { id } = req.params; // match route param name
    const barangay = await Barangay.findById(id);

    if (!barangay) {
      return res.status(404).json({ message: "Barangay not found" });
    }

    res.status(200).json({ barangay }); // singular
  } catch (error) {
    console.error("Error fetching barangay:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all barangays
export const getAllBarangays = async (req, res) => {
  try {
    const barangays = await Barangay.find({});
    res.status(200).json({ barangays });
  } catch (error) {
    console.error("Error fetching barangays:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create a new barangay
export const createBarangay = async (req, res) => {
  try {
    const { barangayName, city, province, region } = req.body;

    if (!req.user || req.user.role !== "Admin") {
      return res
        .status(403)
        .json({ message: "Only admins can create barangays" });
    }

    if (!barangayName || !city || !province || !region) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // enforce per-admin creation limit
    const creatorId = req.user._id;
    const createdCount = await Barangay.countDocuments({
      chairmanId: creatorId,
    });
    const LIMIT = 5;
    if (createdCount >= LIMIT) {
      return res.status(403).json({
        message: `Creation limit reached. Each admin can create up to ${LIMIT} barangays. Contact support to increase this limit.`,
      });
    }

    const newBarangay = await Barangay.create({
      barangayName,
      city,
      province,
      region,
      chairmanId: creatorId,
    });

    res.status(201).json({
      message: "Barangay created successfully",
      barangay: newBarangay,
    });
  } catch (error) {
    console.error("Error creating barangay:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update barangay
export const updateBarangay = async (req, res) => {
  try {
    const { id } = req.params;
    const { barangay, city, province, region } = req.body;

    const updatedBarangay = await Barangay.findByIdAndUpdate(
      id,
      { barangay, city, province, region },
      { new: true }
    );

    if (!updatedBarangay) {
      return res.status(404).json({ message: "Barangay not found" });
    }

    res.status(200).json({
      message: "Barangay updated successfully",
      barangay: updatedBarangay,
    });
  } catch (error) {
    console.error("Error updating barangay:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete barangay
export const deleteBarangay = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Barangay.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Barangay not found" });
    }

    res.status(200).json({ message: "Barangay deleted successfully" });
  } catch (error) {
    console.error("Error deleting barangay:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get users in a barangay
export const getUsersByBarangay = async (req, res) => {
  try {
    const { barangayId } = req.params;

    const users = await User.find({ barangay: barangayId }).select(
      "username email firstname lastname role position"
    );

    res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Assign user to barangay
export const assignUserToBarangay = async (req, res) => {
  try {
    const { userId, barangayId } = req.body;

    // find barangay to capture its display name
    const barangay = await Barangay.findById(barangayId);

    const update = { barangay: barangayId };
    if (barangay && barangay.barangayName)
      update.barangayName = barangay.barangayName;

    const user = await User.findByIdAndUpdate(userId, update, { new: true });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User assigned to barangay successfully",
      user,
    });
  } catch (error) {
    console.error("Error assigning user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Remove user from barangay
export const removeUserFromBarangay = async (req, res) => {
  try {
    const { userId, barangayId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If a barangayId was provided, ensure it matches the user's current barangay
    if (
      barangayId &&
      user.barangay &&
      user.barangay.toString() !== barangayId
    ) {
      return res
        .status(400)
        .json({ message: "User is not assigned to the provided barangay" });
    }

    user.barangay = null;
    user.barangayName = undefined;
    await user.save();

    res.status(200).json({ message: "User removed from barangay", user });
  } catch (error) {
    console.error("Error removing user from barangay:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get barangay storage (documents)
export const getBarangayStorage = async (req, res) => {
  try {
    const { barangayId } = req.params;

    if (!mongoose.isValidObjectId(barangayId)) {
      return res.status(400).json({ message: "Invalid barangay id" });
    }

    const storage = await BarangayStorage.find({ barangay: barangayId })
      .populate("uploadedBy", "username firstname lastname")
      .populate("folder", "name")
      .populate({
        path: "document",
        populate: { path: "sender", select: "username firstname lastname" },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ storage });
  } catch (error) {
    console.error("Error fetching storage:", error);
    console.error(error.stack);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get user's barangay
export const getUserBarangay = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).populate("barangay");

    if (!user || !user.barangay) {
      return res
        .status(404)
        .json({ message: "User not assigned to any barangay" });
    }

    res.status(200).json({ barangay: user.barangay });
  } catch (error) {
    console.error("Error fetching user barangay:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get barangay storage for logged-in user
export const getMyBarangayStorage = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("getMyBarangayStorage called for user:", userId);

    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User barangay:", user.barangay);

    // If user has no barangay, return empty storage
    if (!user.barangay) {
      console.log("User not assigned to any barangay");
      return res.status(200).json({ storage: [] });
    }

    // Extract barangay ID (could be object with _id or direct string/ObjectId)
    let barangayId = user.barangay;
    if (barangayId && typeof barangayId === "object" && barangayId._id) {
      barangayId = barangayId._id;
    }

    console.log("getMyBarangayStorage: user", userId, "barangayId", barangayId);

    // Query storage for this barangay without strict validation (let mongo handle it)
    const storage = await BarangayStorage.find({ barangay: barangayId })
      .populate("uploadedBy", "username firstname lastname")
      .populate("folder", "name")
      .populate({
        path: "document",
        populate: { path: "sender", select: "username firstname lastname" },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ storage });
  } catch (error) {
    console.error("Error fetching storage:", error);
    console.error(error.stack);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create a message/document for a barangay
export const createBarangayMessage = async (req, res) => {
  try {
    const { barangayId } = req.params;
    const senderId = req.user._id;
    const { subject, body, startDate, endDate } = req.body;

    // Only non-admin users assigned to this barangay can send messages to it
    if (req.user && req.user.role === "Admin") {
      return res
        .status(403)
        .json({ message: "Admins cannot send messages to barangays" });
    }

    if (!subject || !body) {
      return res.status(400).json({ message: "Subject and body are required" });
    }

    // Ensure sender is assigned to this barangay
    const sender = await User.findById(senderId);
    if (
      !sender ||
      !sender.barangay ||
      String(sender.barangay) !== String(barangayId)
    ) {
      return res
        .status(403)
        .json({ message: "You are not assigned to this barangay" });
    }

    const barangay = await Barangay.findById(barangayId);
    if (!barangay)
      return res.status(404).json({ message: "Barangay not found" });

    // determine recipient: prefer chairmanId, otherwise any admin
    let recipientId = barangay.chairmanId || null;
    if (!recipientId) {
      const adminUser = await User.findOne({ role: "Admin" });
      if (adminUser) recipientId = adminUser._id;
    }
    if (!recipientId) {
      return res
        .status(400)
        .json({ message: "No admin/recipient available for this barangay" });
    }

    // handle attachment
    let attachmentUrl = null;
    let attachmentName = null;
    if (req.file) {
      attachmentUrl = `/uploads/${req.file.filename}`;
      attachmentName = req.file.originalname;
    }

    const s = startDate ? new Date(startDate) : null;
    const e = endDate ? new Date(endDate) : null;

    // Create message with pending status - DO NOT store directly to barangay yet
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
      isAttached: false,
      attachedToBarangay: barangayId,
    });

    await message.populate("sender", "username firstname lastname");

    res.status(201).json({
      message: "Message sent to admin for approval",
      data: message,
    });
  } catch (error) {
    console.error("Error creating barangay message:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all messages/documents for a barangay (admin view)
export const getBarangayMessages = async (req, res) => {
  try {
    const { barangayId } = req.params;
    const entries = await BarangayStorage.find({ barangay: barangayId })
      .populate({
        path: "document",
        populate: { path: "sender", select: "username firstname lastname" },
      })
      .populate("uploadedBy", "username firstname lastname")
      .sort({ createdAt: -1 });

    res.status(200).json({ entries });
  } catch (error) {
    console.error("Error fetching barangay messages:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Attach an existing message to a barangay (create BarangayStorage pointing to existing Message)
export const attachMessageToBarangay = async (req, res) => {
  try {
    const { barangayId } = req.params;
    const { messageId } = req.body;
    const userId = req.user._id;

    if (!messageId)
      return res.status(400).json({ message: "messageId is required" });

    const barangay = await Barangay.findById(barangayId);
    if (!barangay)
      return res.status(404).json({ message: "Barangay not found" });

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    // Only allow the original sender or admins to attach existing messages
    if (
      String(message.sender) !== String(userId) &&
      req.user.role !== "Admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to attach this message" });
    }

    const storage = await BarangayStorage.create({
      barangay: barangayId,
      document: message._id,
      uploadedBy: userId,
      documentName: message.attachmentName || message.subject,
      documentUrl: message.attachmentUrl || null,
      description: message.body,
    });

    // mark message as attached so it disappears from inboxes
    message.isAttached = true;
    message.attachedToBarangay = barangayId;
    await message.save();

    res.status(201).json({ message: "Message attached to barangay", storage });
  } catch (error) {
    console.error("Error attaching message to barangay:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Detach a message from a barangay: remove BarangayStorage entry and mark message as not attached
export const detachMessageFromBarangay = async (req, res) => {
  try {
    const { barangayId, messageId } = req.params;
    const userId = req.user._id;

    const barangay = await Barangay.findById(barangayId);
    if (!barangay)
      return res.status(404).json({ message: "Barangay not found" });

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    const storage = await BarangayStorage.findOne({
      barangay: barangayId,
      document: messageId,
    });
    if (!storage)
      return res.status(404).json({ message: "Storage entry not found" });

    // Only allow Admins or the original sender or the uploader to detach
    const isSender = String(message.sender) === String(userId);
    const isUploader =
      storage.uploadedBy && String(storage.uploadedBy) === String(userId);
    const isAdmin = req.user && req.user.role === "Admin";

    if (!isAdmin && !isSender && !isUploader) {
      return res
        .status(403)
        .json({ message: "Not authorized to detach this message" });
    }

    // remove the storage entry
    await storage.deleteOne();

    // update message to be visible in inbox again
    message.isAttached = false;
    message.attachedToBarangay = null;
    await message.save();

    res
      .status(200)
      .json({ message: "Message detached from barangay", messageDoc: message });
  } catch (error) {
    console.error("Error detaching message from barangay:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create a folder in a barangay
export const createFolder = async (req, res) => {
  try {
    const { barangayId } = req.params;
    const { name } = req.body;
    const createdBy = req.user._id;

    if (!name) {
      return res.status(400).json({ message: "Folder name is required" });
    }

    const folder = new Folder({
      name,
      barangay: barangayId,
      createdBy,
    });

    await folder.save();

    res.status(201).json({ folder });
  } catch (error) {
    console.error("Error creating folder:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get folders for a barangay
export const getFolders = async (req, res) => {
  try {
    const { barangayId } = req.params;

    const folders = await Folder.find({ barangay: barangayId }).populate(
      "createdBy",
      "firstname lastname username"
    );

    res.status(200).json({ folders });
  } catch (error) {
    console.error("Error fetching folders:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Move a document to a folder
export const moveDocumentToFolder = async (req, res) => {
  try {
    const { barangayId, storageId } = req.params;
    const { folderId } = req.body;

    const storage = await BarangayStorage.findById(storageId);
    if (!storage) {
      return res.status(404).json({ message: "Document not found" });
    }

    storage.folder = folderId || null;
    await storage.save();

    res.status(200).json({ message: "Document moved to folder" });
  } catch (error) {
    console.error("Error moving document:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
