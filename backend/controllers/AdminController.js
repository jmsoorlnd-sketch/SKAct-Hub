import jwt from "jsonwebtoken";
import User from "../models/UserModel.js"; // Using User model for all users
import bcrypt from "bcryptjs";

/**
 * @desc Admin creates a new official account
 */
const createOfficial = async (req, res) => {
  try {
    const { username, email, password, firstname, lastname, position } =
      req.body;

    // 1️⃣ Check if email already exists
    const existEmail = await User.findOne({ email });
    if (existEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // 2️⃣ Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3️⃣ Create new official user with status
    const newOfficial = await User.create({
      username,
      role: "Official",
      email,
      password: hashedPassword,
      firstname: firstname || "",
      lastname: lastname || "",
      position: position || "",
      status: "Active", // ✅ Set initial status
    });

    res.status(201).json({
      message: "Official registered successfully",
      user: {
        _id: newOfficial._id,
        username: newOfficial.username,
        email: newOfficial.email,
        role: newOfficial.role,
        firstname: newOfficial.firstname,
        lastname: newOfficial.lastname,
        position: newOfficial.position,
        status: newOfficial.status, // ✅ include status in response
      },
    });
  } catch (error) {
    console.error("Create Official error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc Get all officials (exclude passwords)
 */
const getAllOfficials = async (req, res) => {
  try {
    const officials = await User.find({ role: "Official" }).select("-password");

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
    const official = await User.findById(officialId).select("-password");

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
 * @desc Reset official's password
 */
const resetOfficialPassword = async (req, res) => {
  try {
    const officialId = req.params.id;
    const { newPassword } = req.body;

    const official = await User.findById(officialId);
    if (!official || official.role !== "Official") {
      return res.status(404).json({ message: "Official not found" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    official.password = hashedPassword;
    await official.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset Official Password error:", error);
    res.status(500).json({ error: error.message });
  }
};

//deactivate official user

const updateOfficialStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Active", "Inactive"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = status;
    await user.save();

    res.status(200).json({
      message: `User ${status.toLowerCase()} successfully`,
      user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default updateOfficialStatus;

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

    // Update only provided fields
    official.firstname = firstname || official.firstname;
    official.lastname = lastname || official.lastname;
    official.position = position || official.position;
    official.email = email || official.email;
    official.username = username || official.username;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      official.password = await bcrypt.hash(password, salt);
    }

    const updatedOfficial = await official.save();

    // Send only **one** response with updated data
    return res.status(200).json(updatedOfficial);
  } catch (error) {
    console.error("Update Official error:", error);
    return res.status(500).json({ message: error.message });
  }
};

export {
  createOfficial,
  getAllOfficials,
  getOfficialById,
  resetOfficialPassword,
  updateOfficialStatus,
  updateOfficial,
};
