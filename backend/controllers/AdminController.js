import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import bcrypt from "bcryptjs";

/**
 * @desc Admin creates a new official account
 */
const createOfficial = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      firstname,
      lastname,
      position,
      barangay,
    } = req.body;

    // 1️⃣ Check if email exists
    const existEmail = await User.findOne({ email });
    if (existEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Check if username exists
    const existUsername = await User.findOne({ username });
    if (existUsername) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // 2️⃣ Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3️⃣ Create official
    const newOfficial = await User.create({
      username,
      email,
      password: hashedPassword,
      firstname: firstname || "",
      lastname: lastname || "",
      position: position || "",
      role: "Official",
      status: "Active",
      barangay: barangay || null, // store ObjectId reference
    });

    // Populate barangay name for frontend
    await newOfficial.populate("barangay");

    res.status(201).json({
      message: "Official created successfully",
      user: {
        _id: newOfficial._id,
        username: newOfficial.username,
        email: newOfficial.email,
        role: newOfficial.role,
        firstname: newOfficial.firstname,
        lastname: newOfficial.lastname,
        position: newOfficial.position,
        barangay: newOfficial.barangay, // Send full barangay object
        status: newOfficial.status,
      },
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
    const officials = await User.find({ role: "Official" })
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

    // Check if email is being changed and already exists
    if (email && email !== official.email) {
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
    if (email) official.email = email;
    if (username) official.username = username;

    // Hash new password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      official.password = await bcrypt.hash(password, salt);
    }

    const updatedOfficial = await official.save();
    await updatedOfficial.populate("barangay");

    // Send response without password
    return res.status(200).json({
      _id: updatedOfficial._id,
      username: updatedOfficial.username,
      email: updatedOfficial.email,
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
};
