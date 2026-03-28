import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import UserLog from "../models/UserLogModel.js";
import bcrypt from "bcryptjs";
import { validateEmail } from "../utils/validateEmail.js";

// helper for random strings used when credentials are auto-generated
const randomString = (length = 8) => {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < length; i++) {
    s += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return s;
};

/**
 * @desc Admin creates a new official account
 * @note Only one official per position allowed per barangay
 *       If creating with duplicate position, old official is deactivated
 */
const createOfficial = async (req, res) => {
  try {
    let { username, email, password, firstname, lastname, position, barangay } =
      req.body;

    // auto‑generate username / password if missing
    if (!username || !username.trim()) {
      const base = `${firstname || ""}${lastname || ""}`
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "");
      username = base
        ? `${base}${Math.floor(Math.random() * 9000) + 1000}`
        : `user${randomString(5)}`;
    }

    if (!password || password.length < 8) {
      password = randomString(10);
    }

    // Validate required fields
    if (!firstname || !firstname.trim()) {
      return res.status(400).json({ message: "First name is required" });
    }

    if (!lastname || !lastname.trim()) {
      return res.status(400).json({ message: "Last name is required" });
    }

    if (!username || !username.trim()) {
      return res.status(400).json({ message: "Username is required" });
    }

    if (!password || password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    if (!position) {
      return res.status(400).json({ message: "Position is required" });
    }

    if (!barangay) {
      return res.status(400).json({ message: "Barangay is required" });
    }

    // Email is optional - only check uniqueness if provided
    if (email && email.trim()) {
      // ✅ Validate email provider + MX record
      const emailCheck = await validateEmail(email.trim());
      if (!emailCheck.valid) {
        return res.status(400).json({ message: emailCheck.reason });
      }

      const existEmail = await User.findOne({ email });
      if (existEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }
    // Check if username exists
    // ensure uniqueness of generated or provided username
    let existUsername = await User.findOne({ username });
    if (existUsername) {
      // try again with suffix if collision
      username = `${username}${Math.floor(Math.random() * 9000) + 1000}`;
      existUsername = await User.findOne({ username });
      if (existUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
    }

    // ===== POSITION-BASED LIMIT CHECK =====
    // Check if another ACTIVE official with same position exists in this barangay
    let deactivatedOfficial = null;
    const existingOfficial = await User.findOne({
      barangay,
      position,
      status: "Active",
      role: "Official",
    });

    if (existingOfficial) {
      // Deactivate the existing official with this position
      existingOfficial.status = "Inactive";
      await existingOfficial.save();
      deactivatedOfficial = {
        _id: existingOfficial._id,
        firstname: existingOfficial.firstname,
        lastname: existingOfficial.lastname,
        position: existingOfficial.position,
      };

      // Log the deactivation action
      try {
        await UserLog.create({
          userId: req.user._id,
          username: req.user.username,
          firstname: req.user.firstname,
          lastname: req.user.lastname,
          barangayId: req.user.barangay,
          role: req.user.role,
          actionType: "deactivate_user",
          description: `Admin deactivated official: ${existingOfficial.firstname} ${existingOfficial.lastname} (${existingOfficial.position}) to make room for new ${position} official`,
          ipAddress: req.ip || "Unknown",
          userAgent: req.get("user-agent") || "Unknown",
        });
      } catch (logError) {
        console.error("Error logging deactivation:", logError);
        // Don't fail the creation if logging fails
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create official - only include email if provided
    const newOfficialData = {
      username,
      password: hashedPassword,
      firstname: firstname.trim(),
      lastname: lastname.trim(),
      position,
      role: "Official",
      status: "Active",
      barangay,
    };

    // Only include email if it's provided and not empty
    if (email && email.trim()) {
      newOfficialData.email = email.trim();
    }

    const newOfficial = await User.create(newOfficialData);

    // Populate barangay name for frontend
    await newOfficial.populate("barangay");

    // Log the create_user action
    try {
      await UserLog.create({
        userId: req.user._id,
        username: req.user.username,
        firstname: req.user.firstname,
        lastname: req.user.lastname,
        barangayId: req.user.barangay,
        role: req.user.role,
        actionType: "create_user",
        description: `Admin created new user: ${newOfficial.firstname} ${newOfficial.lastname} (${newOfficial.username}) with role ${newOfficial.role}${deactivatedOfficial ? ` [replaced ${deactivatedOfficial.firstname} ${deactivatedOfficial.lastname}]` : ""}`,
        ipAddress: req.ip || "Unknown",
        userAgent: req.get("user-agent") || "Unknown",
      });
    } catch (logError) {
      console.error("Error logging create_user action:", logError);
      // Don't fail the creation if logging fails
    }

    let message = "Official created successfully";
    if (deactivatedOfficial) {
      message = `Official created successfully. Previous ${position} officer (${deactivatedOfficial.firstname} ${deactivatedOfficial.lastname}) has been deactivated.`;
    }

    res.status(201).json({
      message,
      user: {
        _id: newOfficial._id,
        username: newOfficial.username,
        email: newOfficial.email || "",
        role: newOfficial.role,
        firstname: newOfficial.firstname,
        lastname: newOfficial.lastname,
        position: newOfficial.position,
        barangay: newOfficial.barangay,
        status: newOfficial.status,
      },
      // if credentials were auto generated we return them for admin reference
      credentials: {
        username,
        password,
      },
      // Include info about deactivated official if applicable
      deactivatedOfficial,
    });
  } catch (error) {
    console.error("Create Official error:", error);
    res.status(500).json({
      message: "Failed to create official",
      error: error.message,
    });
  }
};

/**
 * @desc Get all officials
 */
const getAllOfficials = async (req, res) => {
  try {
    const officials = await User.find({ role: "Official", isDeleted: false })
      .select("-password")
      .populate("barangay", "barangayName ");

    res.status(200).json(officials);
  } catch (error) {
    console.error("Get All Officials error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc Get a single official by ID
 */
const getOfficialById = async (req, res) => {
  try {
    const officialId = req.params.id;
    const official = await User.findById(officialId)
      .select("-password")
      .populate("barangay");

    if (!official || official.role !== "Official") {
      return res.status(404).json({ message: "Official not found" });
    }

    res.status(200).json(official);
  } catch (error) {
    console.error("Get Official by ID error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc Update official status (Active/Inactive)
 */
const updateOfficialStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Active", "Inactive"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "Official") {
      return res.status(400).json({ message: "User is not an official" });
    }

    user.status = status;
    await user.save();

    res.status(200).json({
      message: `User ${status.toLowerCase()} successfully`,
      user,
    });
  } catch (error) {
    console.error("Update Official Status error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc Delete an official (soft delete)
 */
const deleteOfficial = async (req, res) => {
  try {
    const { id } = req.params;

    const official = await User.findById(id);
    if (!official || official.role !== "Official") {
      return res.status(404).json({ message: "Official not found" });
    }

    // Soft delete - mark as deleted
    official.isDeleted = true;
    official.deletedAt = new Date();
    await official.save();

    // Log the delete_user action
    try {
      await UserLog.create({
        userId: req.user._id,
        username: req.user.username,
        firstname: req.user.firstname,
        lastname: req.user.lastname,
        barangayId: req.user.barangay,
        role: req.user.role,
        actionType: "delete_user",
        description: `Admin deleted user: ${official.firstname} ${official.lastname} (${official.username})`,
        ipAddress: req.ip || "Unknown",
        userAgent: req.get("user-agent") || "Unknown",
      });
    } catch (logError) {
      console.error("Error logging delete_user action:", logError);
      // Don't fail the deletion if logging fails
    }

    res.status(200).json({
      message: "Official deleted successfully",
    });
  } catch (error) {
    console.error("Delete Official error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc Get all deleted users
 */
const getDeletedUsers = async (req, res) => {
  try {
    const deletedUsers = await User.find({ isDeleted: true }).sort({
      deletedAt: -1,
    });

    res.status(200).json({
      users: deletedUsers,
    });
  } catch (error) {
    console.error("Get Deleted Users error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc Restore a deleted user
 */
const restoreDeletedUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isDeleted) {
      return res.status(400).json({ message: "User is not deleted" });
    }

    user.isDeleted = false;
    user.deletedAt = null;
    await user.save();

    res.status(200).json({
      message: "User restored successfully",
      user,
    });
  } catch (error) {
    console.error("Restore Deleted User error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc Permanently delete a user
 */
const permanentlyDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.findByIdAndDelete(id);

    // Log the delete_user action for permanent deletion
    try {
      await UserLog.create({
        userId: req.user._id,
        username: req.user.username,
        firstname: req.user.firstname,
        lastname: req.user.lastname,
        barangayId: req.user.barangay,
        role: req.user.role,
        actionType: "delete_user",
        description: `Admin permanently deleted user: ${user.firstname} ${user.lastname} (${user.username})`,
        ipAddress: req.ip || "Unknown",
        userAgent: req.get("user-agent") || "Unknown",
      });
    } catch (logError) {
      console.error("Error logging delete_user action:", logError);
      // Don't fail the deletion if logging fails
    }

    res.status(200).json({
      message: "User permanently deleted",
    });
  } catch (error) {
    console.error("Permanently Delete User error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc Update official details
 */
const updateOfficial = async (req, res) => {
  try {
    const officialId = req.params.id;
    const { firstname, lastname, position, email, username, password } =
      req.body;

    const official = await User.findById(officialId);
    if (!official || official.role !== "Official") {
      return res.status(404).json({ message: "Official not found" });
    }

    // Check if email is being changed and already exists (only if email is provided and not empty)
    if (email && email.trim() && email !== official.email) {
      // ✅ Validate email provider + MX record
      const emailCheck = await validateEmail(email.trim());
      if (!emailCheck.valid) {
        return res.status(400).json({ message: emailCheck.reason });
      }

      const existEmail = await User.findOne({ email });
      if (existEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }
    // Check if username is being changed and already exists
    if (username && username !== official.username) {
      const existUsername = await User.findOne({ username });
      if (existUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
    }

    // Update only provided fields
    if (firstname) official.firstname = firstname;
    if (lastname) official.lastname = lastname;
    if (position) official.position = position;
    // Handle email - can be updated, cleared, or left as is
    if (email !== undefined) {
      if (email && email.trim()) {
        official.email = email;
      } else {
        // Clear email if empty string is provided
        official.email = undefined;
      }
    }
    if (username) official.username = username;

    // Hash new password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      official.password = await bcrypt.hash(password, salt);
    }

    const updatedOfficial = await official.save();
    await updatedOfficial.populate("barangay");

    // Log the edit_user action
    try {
      const changedFields = [];
      if (firstname) changedFields.push("firstname");
      if (lastname) changedFields.push("lastname");
      if (position) changedFields.push("position");
      if (email !== undefined) changedFields.push("email");
      if (username) changedFields.push("username");
      if (password) changedFields.push("password");

      await UserLog.create({
        userId: req.user._id,
        username: req.user.username,
        firstname: req.user.firstname,
        lastname: req.user.lastname,
        barangayId: req.user.barangay,
        role: req.user.role,
        actionType: "edit_user",
        description: `Admin edited user: ${updatedOfficial.firstname} ${updatedOfficial.lastname} (${updatedOfficial.username}). Changed fields: ${changedFields.join(", ")}`,
        ipAddress: req.ip || "Unknown",
        userAgent: req.get("user-agent") || "Unknown",
      });
    } catch (logError) {
      console.error("Error logging edit_user action:", logError);
      // Don't fail the update if logging fails
    }

    // Send response without password
    return res.status(200).json({
      _id: updatedOfficial._id,
      username: updatedOfficial.username,
      email: updatedOfficial.email || "",
      firstname: updatedOfficial.firstname,
      lastname: updatedOfficial.lastname,
      position: updatedOfficial.position,
      barangay: updatedOfficial.barangay,
      role: updatedOfficial.role,
      status: updatedOfficial.status,
    });
  } catch (error) {
    console.error("Update Official error:", error);
    return res.status(500).json({
      message: "Failed to update official",
      error: error.message,
    });
  }
};

// ✅ Export all functions as named exports
export {
  createOfficial,
  getAllOfficials,
  getOfficialById,
  updateOfficialStatus,
  updateOfficial,
  deleteOfficial,
  getDeletedUsers,
  restoreDeletedUser,
  permanentlyDeleteUser,
};
