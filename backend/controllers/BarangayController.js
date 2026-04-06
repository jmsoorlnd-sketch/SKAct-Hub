import Barangay from "../models/BarangayModel.js";
import User from "../models/UserModel.js";
import UserLog from "../models/UserLogModel.js";
import BarangayStorage from "../models/BarangayStorageModel.js";
import Message from "../models/MessageModel.js";
import Folder from "../models/FolderModel.js";
import mongoose from "mongoose";
import { createAndEmitNotification } from "./NotificationController.js";

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
      { new: true },
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

    const barangay = await Barangay.findById(id);
    if (!barangay) {
      return res.status(404).json({ message: "Barangay not found" });
    }

    // Soft delete - mark as deleted
    barangay.isDeleted = true;
    barangay.deletedAt = new Date();
    await barangay.save();

    // Log the delete_barangay action
    try {
      await UserLog.create({
        userId: req.user._id,
        username: req.user.username,
        firstname: req.user.firstname,
        lastname: req.user.lastname,
        barangayId: req.user.barangay,
        role: req.user.role,
        actionType: "delete_barangay",
        description: `Admin deleted barangay: ${barangay.barangayName} (${barangay.city}, ${barangay.province})`,
        ipAddress: req.ip || "Unknown",
        userAgent: req.get("user-agent") || "Unknown",
      });
    } catch (logError) {
      console.error("Error logging delete_barangay action:", logError);
      // Don't fail the deletion if logging fails
    }

    res.status(200).json({ message: "Barangay deleted successfully" });
  } catch (error) {
    console.error("Error deleting barangay:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Get all deleted barangays
 */
export const getDeletedBarangays = async (req, res) => {
  try {
    const deletedBarangays = await Barangay.find({ isDeleted: true })
      .populate("chairmanId", "firstname lastname username")
      .sort({ deletedAt: -1 });

    res.status(200).json({ barangays: deletedBarangays });
  } catch (error) {
    console.error("Error fetching deleted barangays:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Restore a deleted barangay with all its deleted documents
 */
export const restoreDeletedBarangay = async (req, res) => {
  try {
    const { id } = req.params;

    const barangay = await Barangay.findById(id);
    if (!barangay) {
      return res.status(404).json({ message: "Barangay not found" });
    }

    if (!barangay.isDeleted) {
      return res.status(400).json({ message: "Barangay is not deleted" });
    }

    // Restore barangay
    barangay.isDeleted = false;
    barangay.deletedAt = null;
    await barangay.save();

    // Restore all deleted storage documents and folders in this barangay
    await BarangayStorage.updateMany(
      { barangay: id, isDeleted: true },
      { $set: { isDeleted: false, deletedAt: null } },
    );

    await Folder.updateMany(
      { barangay: id, isDeleted: true },
      { $set: { isDeleted: false, deletedAt: null } },
    );

    // Log the restore_barangay action
    try {
      await UserLog.create({
        userId: req.user._id,
        username: req.user.username,
        firstname: req.user.firstname,
        lastname: req.user.lastname,
        barangayId: req.user.barangay,
        role: req.user.role,
        actionType: "restore_barangay",
        description: `Admin restored barangay: ${barangay.barangayName} (${barangay.city}, ${barangay.province})`,
        ipAddress: req.ip || "Unknown",
        userAgent: req.get("user-agent") || "Unknown",
      });
    } catch (logError) {
      console.error("Error logging restore_barangay action:", logError);
      // Don't fail the restore if logging fails
    }

    res.status(200).json({
      message: "Barangay and its documents restored successfully",
      barangay,
    });
  } catch (error) {
    console.error("Error restoring barangay:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * Permanently delete a barangay
 */
export const permanentlyDeleteBarangay = async (req, res) => {
  try {
    const { id } = req.params;

    const barangay = await Barangay.findById(id);
    if (!barangay) {
      return res.status(404).json({ message: "Barangay not found" });
    }

    // Delete all related documents, folders, and messages
    await BarangayStorage.deleteMany({ barangay: id });
    await Folder.deleteMany({ barangay: id });
    await Message.deleteMany({ attachedToBarangay: id });

    // Delete the barangay
    await Barangay.findByIdAndDelete(id);

    // Log the delete_barangay action (permanent deletion)
    try {
      await UserLog.create({
        userId: req.user._id,
        username: req.user.username,
        firstname: req.user.firstname,
        lastname: req.user.lastname,
        barangayId: req.user.barangay,
        role: req.user.role,
        actionType: "delete_barangay",
        description: `Admin permanently deleted barangay: ${barangay.barangayName} (${barangay.city}, ${barangay.province})`,
        ipAddress: req.ip || "Unknown",
        userAgent: req.get("user-agent") || "Unknown",
      });
    } catch (logError) {
      console.error("Error logging delete_barangay action:", logError);
      // Don't fail the deletion if logging fails
    }

    res.status(200).json({
      message: "Barangay and all its data permanently deleted",
    });
  } catch (error) {
    console.error("Error permanently deleting barangay:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get users in a barangay
export const getUsersByBarangay = async (req, res) => {
  try {
    const { barangayId } = req.params;

    // Admins can query any barangay; officials can only query their own barangay
    if (
      req.user.role !== "Admin" &&
      (!req.user.barangay || String(req.user.barangay) !== String(barangayId))
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const users = await User.find({ barangay: barangayId }).select(
      "username email firstname lastname role position",
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

    const storage = await BarangayStorage.find({
      barangay: barangayId,
      isDeleted: false,
    })
      .populate("uploadedBy", "username firstname lastname")
      .populate("folder", "name")
      .populate({
        path: "document",
        populate: { path: "sender", select: "username firstname lastname" },
      })
      .sort({ createdAt: -1 });

    // Filter-out any attached documents that were deleted after being stored
    const filteredStorage = storage.filter(
      (item) => item.document && !item.document.isDeleted,
    );

    res.status(200).json({ storage: filteredStorage });
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

    // Build base query for this barangay
    const baseQuery = { barangay: barangayId, isDeleted: false };

    // By default, admin sees everything (if /me/storage is used for admin)
    if (user.role === "Admin") {
      const storage = await BarangayStorage.find(baseQuery)
        .populate("uploadedBy", "username firstname lastname")
        .populate("folder", "name")
        .populate({
          path: "document",
          populate: { path: "sender", select: "username firstname lastname" },
        })
        .sort({ createdAt: -1 });

      return res.status(200).json({ storage });
    }

    // Determine folders the user may access via sharing
    let visibleFolderIds = [];
    if (["Secretary", "Treasurer", "Chairman"].includes(user.position)) {
      const folderQuery = {
        barangay: barangayId,
        isDeleted: false,
        $or: [
          { createdBy: userId },
          { isShared: true },
          { sharedBy: userId },
          { sharedWithRoles: user.position },
        ],
      };
      const folderDocs = await Folder.find(folderQuery).select("_id");
      visibleFolderIds = folderDocs.map((f) => f._id);
    }

    const storageQuery = {
      ...baseQuery,
      $or: [
        { uploadedBy: userId },
        ...(visibleFolderIds.length > 0
          ? [{ folder: { $in: visibleFolderIds } }]
          : []),
      ],
    };

    const storage = await BarangayStorage.find(storageQuery)
      .populate("uploadedBy", "username firstname lastname")
      .populate("folder", "name")
      .populate({
        path: "document",
        populate: { path: "sender", select: "username firstname lastname" },
      })
      .sort({ createdAt: -1 });

    const filteredStorage = storage.filter(
      (item) => item.document && !item.document.isDeleted,
    );

    res.status(200).json({ storage: filteredStorage });
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
    const { subject, body, startDate, endDate, folderId } = req.body;

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

    // Verify folderId belongs to this barangay if provided
    if (folderId) {
      const folder = await Folder.findById(folderId);
      if (!folder || String(folder.barangay) !== String(barangayId)) {
        return res
          .status(404)
          .json({ message: "Folder not found in this barangay" });
      }
    }

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

    // handle attachments (multiple files)
    let attachmentUrls = [];
    let attachmentNames = [];
    if (req.files && req.files.length > 0) {
      attachmentUrls = req.files.map((file) => `/uploads/${file.filename}`);
      attachmentNames = req.files.map((file) => file.originalname);
    }

    const s = startDate ? new Date(startDate) : null;
    const e = endDate ? new Date(endDate) : null;

    // Create message with pending status (always requires approval)
    const message = await Message.create({
      sender: senderId,
      recipient: recipientId,
      subject,
      body,
      attachmentUrls,
      attachmentNames,
      startDate: s,
      endDate: e,
      status: "pending",
      isAttached: false,
      attachedToBarangay: folderId ? barangayId : null,
      intendedFolder: folderId || null,
    });

    await message.populate("sender", "username firstname lastname");

    // Get io instance
    const io = req.app.get("io");

    // ===== REAL-TIME NOTIFICATION TO ADMIN =====
    // Create notification for the admin recipient
    await createAndEmitNotification(
      io,
      recipientId, // Admin user ID
      message._id.toString(), // Notification ID
      "message_pending", // Notification type
      `📄 New Document Pending: ${subject}`, // Title
      `From: ${sender.firstname} ${sender.lastname} (${sender.position || "Official"}) - ${barangay.barangayName}`, // Subtitle
      {
        messageId: message._id,
        senderId: senderId,
        barangayId: barangayId,
        folderId: folderId,
      },
    );

    // Also emit to role-based room for any admin listening
    io.to("role-Admin").emit("new-notification", {
      id: message._id.toString(),
      type: "message_pending",
      title: `📄 New Document Pending: ${subject}`,
      subtitle: `From: ${sender.firstname} ${sender.lastname} - ${barangay.barangayName}`,
      time: new Date(),
      seen: false,
      meta: {
        messageId: message._id,
        barangayId: barangayId,
        folderId: folderId,
      },
    });

    // Log the action
    try {
      await UserLog.create({
        userId: req.user._id,
        username: req.user.username,
        firstname: req.user.firstname,
        lastname: req.user.lastname,
        barangayId: barangayId,
        role: req.user.role,
        actionType: "create_message",
        description: `Created message: "${subject}" for approval in ${barangay.barangayName}`,
        ipAddress: req.ip || "Unknown",
        userAgent: req.get("user-agent") || "Unknown",
      });
    } catch (logError) {
      console.error("Error logging create message action:", logError);
    }

    res.status(201).json({
      message: "Message sent to admin for approval",
      data: message,
    });
  } catch (error) {
    console.error("Error creating barangay message:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}; // Get all messages/documents for a barangay (admin view)
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

    if (req.user.position === "Treasurer") {
      return res
        .status(403)
        .json({ message: "Treasurer is not permitted to remove documents" });
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
    const { name, documentType, isShared, sharedWithRoles = [] } = req.body;
    const createdBy = req.user._id;

    if (!name) {
      return res.status(400).json({ message: "Folder name is required" });
    }

    const validatedSharedWithRoles = Array.isArray(sharedWithRoles)
      ? sharedWithRoles.filter((r) =>
          ["Secretary", "Treasurer", "Chairman"].includes(r),
        )
      : [];

    const folder = new Folder({
      name,
      barangay: barangayId,
      createdBy,
      status: documentType ? "completed" : "pending",
      documentType: documentType || null,
      isShared: !!isShared,
      sharedWithRoles: validatedSharedWithRoles,
    });

    await folder.save();

    // Log the action
    try {
      await UserLog.create({
        userId: req.user._id,
        username: req.user.username,
        firstname: req.user.firstname,
        lastname: req.user.lastname,
        barangayId: barangayId,
        role: req.user.role,
        actionType: "create_folder",
        description: `Created folder: ${name}`,
        ipAddress: req.ip || "Unknown",
        userAgent: req.get("user-agent") || "Unknown",
      });
    } catch (logError) {
      console.error("Error logging create folder action:", logError);
    }

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
    const userId = req.user && req.user._id;

    // build query
    const q = { barangay: barangayId, isDeleted: false };

    // Secretaries and treasurers can see folders they created and shared folders in the barangay
    if (req.user && req.user.position === "Secretary") {
      q.$or = [
        { createdBy: userId },
        { sharedBy: userId },
        { sharedWithRoles: "Secretary" },
        { sharedWithRoles: "Treasurer" },
        { isShared: true },
      ];
    } else if (req.user && req.user.position === "Treasurer") {
      q.$or = [
        { createdBy: userId },
        { sharedBy: userId },
        { sharedWithRoles: "Treasurer" },
        { sharedWithRoles: "Secretary" },
        { isShared: true },
      ];
    } else if (req.user && req.user.position === "Chairman") {
      // Chairman can see all folders in the barangay
      // no additional filters required
    } else if (req.user && req.user.role !== "Admin") {
      // Other users can see their own, shared-by-them, and shared folders
      q.$or = [{ createdBy: userId }, { sharedBy: userId }, { isShared: true }];
    }

    const folders = await Folder.find(q).populate(
      "createdBy",
      "firstname lastname username",
    );

    res.status(200).json({ folders });
  } catch (error) {
    console.error("Error fetching folders:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get archived (deleted) folders and messages for a barangay
export const getArchive = async (req, res) => {
  try {
    const { barangayId } = req.params;
    const userId = req.user && req.user._id;

    // Archived folders (deleted)
    const folderQuery = { barangay: barangayId, isDeleted: true };
    if (
      req.user &&
      (req.user.position === "Secretary" || req.user.position === "Treasurer")
    ) {
      folderQuery.createdBy = userId;
    }

    const folders = await Folder.find(folderQuery).populate(
      "createdBy",
      "firstname lastname username",
    );

    // Archived messages for this barangay:
    // - soft-deleted items (isDeleted=true)
    // - canceled events (status=cancelled)
    const messageQuery = {
      attachedToBarangay: barangayId,
      $or: [{ isDeleted: true }, { status: "cancelled" }],
    };

    // For officials, exclude admin-scheduled events and admin deletions
    if (req.user && req.user.role !== "Admin") {
      messageQuery.isAdminScheduled = false;
    }

    let messages = await Message.find(messageQuery)
      .populate("sender", "username email role")
      .populate("recipient", "username email role")
      .populate("deletedBy", "username role")
      .sort({ deletedAt: -1 });

    if (req.user && req.user.role !== "Admin") {
      messages = messages.filter(
        (msg) =>
          !msg.isAdminScheduled &&
          !(msg.deletedBy && msg.deletedBy.role === "Admin"),
      );
    }

    res.status(200).json({ folders, messages });
  } catch (error) {
    console.error("Error fetching archive:", error);
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

    const folder = await Folder.findById(folderId);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    // Only folder owner, chairman, or shared role can add files to folder.
    const userPosition = req.user.position;
    const isOwner = String(folder.createdBy) === String(req.user._id);
    const isChairman = userPosition === "Chairman";
    const isSharedToUserRole = folder.sharedWithRoles.includes(userPosition);

    if (!isOwner && !isChairman && !isSharedToUserRole) {
      return res.status(403).json({
        message: "You are not authorized to move documents into this folder",
      });
    }

    storage.folder = folderId || null;
    await storage.save();

    res.status(200).json({ message: "Document moved to folder" });
  } catch (error) {
    console.error("Error moving document:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a folder and archive all its documents
export const deleteFolder = async (req, res) => {
  try {
    const { barangayId, folderId } = req.params;

    // Find the folder
    const folder = await Folder.findById(folderId);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    // Check if folder belongs to the barangay
    if (String(folder.barangay) !== String(barangayId)) {
      return res
        .status(403)
        .json({ message: "Folder does not belong to this barangay" });
    }

    // Treasurer cannot delete folders (only Secretary & Chairman may delete)
    if (req.user.position === "Treasurer") {
      return res
        .status(403)
        .json({ message: "Treasurer is not permitted to delete folders" });
    }

    // Find all documents in this folder
    const documentsInFolder = await BarangayStorage.find({ folder: folderId });

    // Archive (soft-delete) all documents in this folder instead of returning them to stored
    if (documentsInFolder.length > 0) {
      await BarangayStorage.updateMany(
        { folder: folderId },
        {
          $set: {
            isDeleted: true,
            deletedAt: new Date(),
            folder: null,
          },
        },
      );
    }

    // Soft-delete the folder instead of permanently deleting
    folder.isDeleted = true;
    folder.deletedAt = new Date();
    folder.deletedBy = req.user._id;
    await folder.save();

    // Log the action
    try {
      await UserLog.create({
        userId: req.user._id,
        username: req.user.username,
        firstname: req.user.firstname,
        lastname: req.user.lastname,
        barangayId: barangayId,
        role: req.user.role,
        actionType: "delete_folder",
        description: `Deleted folder: ${folder.name}`,
        ipAddress: req.ip || "Unknown",
        userAgent: req.get("user-agent") || "Unknown",
      });
    } catch (logError) {
      console.error("Error logging delete folder action:", logError);
    }

    res.status(200).json({
      message: "Folder deleted successfully",
      documentsReturned: documentsInFolder.length,
      returnedDocuments: documentsInFolder,
    });
  } catch (error) {
    console.error("Error deleting folder:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Restore a soft-deleted folder
export const restoreFolder = async (req, res) => {
  try {
    const { barangayId, folderId } = req.params;

    const folder = await Folder.findById(folderId);
    if (!folder) return res.status(404).json({ message: "Folder not found" });

    if (String(folder.barangay) !== String(barangayId)) {
      return res
        .status(403)
        .json({ message: "Folder does not belong to this barangay" });
    }

    if (!folder.isDeleted) {
      return res.status(400).json({ message: "Folder is not deleted" });
    }

    folder.isDeleted = false;
    folder.deletedAt = null;
    folder.deletedBy = null;
    await folder.save();

    res.status(200).json({ message: "Folder restored successfully", folder });
  } catch (error) {
    console.error("Error restoring folder:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Permanently delete a folder (hard delete)
export const hardDeleteFolder = async (req, res) => {
  try {
    const { barangayId, folderId } = req.params;

    const folder = await Folder.findById(folderId);
    if (!folder) return res.status(404).json({ message: "Folder not found" });

    if (String(folder.barangay) !== String(barangayId)) {
      return res
        .status(403)
        .json({ message: "Folder does not belong to this barangay" });
    }

    // Remove folder assignment from all documents
    await BarangayStorage.updateMany(
      { folder: folderId },
      { $set: { folder: null } },
    );

    await Folder.findByIdAndDelete(folderId);

    res.status(200).json({ message: "Folder permanently deleted" });
  } catch (error) {
    console.error("Error hard deleting folder:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update folder status (pending / ongoing / completed / approved)
export const updateFolderStatus = async (req, res) => {
  try {
    const { barangayId, folderId } = req.params;
    const { status } = req.body;

    if (
      !status ||
      !["pending", "ongoing", "completed", "approved"].includes(status)
    ) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const folder = await Folder.findById(folderId);
    if (!folder) return res.status(404).json({ message: "Folder not found" });

    if (String(folder.barangay) !== String(barangayId)) {
      return res
        .status(403)
        .json({ message: "Folder does not belong to this barangay" });
    }

    folder.status = status;
    await folder.save();

    res.status(200).json({ message: "Folder status updated", folder });
  } catch (error) {
    console.error("Error updating folder status:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Toggle folder share visibility within barangay
export const shareFolder = async (req, res) => {
  try {
    const { barangayId, folderId } = req.params;
    const { isShared, shareWithRole } = req.body;

    const folder = await Folder.findById(folderId);
    if (!folder) {
      return res.status(404).json({ message: "Folder not found" });
    }

    if (String(folder.barangay) !== String(barangayId)) {
      return res
        .status(403)
        .json({ message: "Folder does not belong to this barangay" });
    }

    if (req.user.barangay && String(req.user.barangay) !== String(barangayId)) {
      return res
        .status(403)
        .json({ message: "You are not assigned to this barangay" });
    }

    // Only chairman, secretary, and treasurer can toggle sharing
    if (!["Chairman", "Secretary", "Treasurer"].includes(req.user.position)) {
      return res.status(403).json({
        message: "Only designated barangay officials can share folders",
      });
    }

    const VALID_ROLES = ["Secretary", "Treasurer", "Chairman"];
    if (isShared && shareWithRole && !VALID_ROLES.includes(shareWithRole)) {
      return res.status(400).json({ message: "Invalid shareWithRole" });
    }

    // Only creator or existing sharer can unshare
    const isCreator = String(folder.createdBy) === String(req.user._id);
    const isSharer = folder.sharedBy
      .map((u) => String(u))
      .includes(String(req.user._id));

    if (!isShared && !isCreator && !isSharer) {
      return res.status(403).json({
        message:
          "Only the creator or the original shared user can unshare this folder",
      });
    }

    // Determine sharing policy:
    // Secretary <-> Treasurer sharing.
    // Chairman can share to any.
    if (req.user.position === "Secretary") {
      if (isShared && shareWithRole !== "Treasurer") {
        return res.status(400).json({
          message: "Secretary can only share folders with Treasurer",
        });
      }
      const roles = new Set(folder.sharedWithRoles);
      if (isShared) {
        roles.add("Treasurer");
        roles.add("Secretary");
      } else {
        // Unshare by secretary
        roles.delete("Treasurer");
        if (isCreator) {
          roles.clear();
        } else {
          roles.add("Secretary");
        }
      }
      folder.sharedWithRoles = Array.from(roles);
    } else if (req.user.position === "Treasurer") {
      if (isShared && shareWithRole !== "Secretary") {
        return res.status(400).json({
          message: "Treasurer can only share folders with Secretary",
        });
      }
      const roles = new Set(folder.sharedWithRoles);
      if (isShared) {
        roles.add("Secretary");
        roles.add("Treasurer");
      } else {
        // Unshare by treasurer
        roles.delete("Secretary");
        if (isCreator) {
          roles.clear();
        } else {
          roles.add("Treasurer");
        }
      }
      folder.sharedWithRoles = Array.from(roles);
    } else if (req.user.position === "Chairman") {
      if (
        isShared &&
        shareWithRole &&
        !["Secretary", "Treasurer", "Chairman"].includes(shareWithRole)
      ) {
        return res.status(400).json({
          message: "Invalid shareWithRole",
        });
      }
      const roles = new Set(folder.sharedWithRoles);
      if (isShared) {
        roles.add("Secretary");
        roles.add("Treasurer");
        roles.add("Chairman");
      } else {
        // Unshare by chairman (partial reset for non-creator)
        if (isCreator) {
          roles.clear();
        } else {
          roles.delete("Secretary");
          roles.delete("Treasurer");
          roles.add("Chairman");
        }
      }
      folder.sharedWithRoles = Array.from(roles);
    }

    folder.isShared = !!isShared;

    if (isShared && !isSharer) {
      folder.sharedBy.push(req.user._id);
    }
    if (!isShared && !isCreator) {
      folder.sharedBy = folder.sharedBy.filter(
        (id) => String(id) !== String(req.user._id),
      );
    }

    if (!folder.isShared && !isCreator) {
      // if nothing is shared to others and not creator, keep folder not shared
      folder.sharedBy = folder.sharedBy.filter(
        (id) => String(id) === String(folder.createdBy),
      );
    }

    await folder.save();

    res.status(200).json({
      message: `Folder ${folder.isShared ? "shared" : "unshared"} successfully`,
      folder,
    });
  } catch (error) {
    console.error("Error toggling folder share:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
