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

    // 3️⃣ Create new official user
    const newOfficial = await User.create({
      username,
      role: "Official",
      email,
      password: hashedPassword,
      firstname: firstname || "",
      lastname: lastname || "",
      position: position || "",
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

/**
 * @desc Delete an official
 */
const deleteOfficial = async (req, res) => {
  try {
    const officialId = req.params.id;

    const official = await User.findById(officialId);
    if (!official || official.role !== "Official") {
      return res.status(404).json({ message: "Official not found" });
    }

    // 2️⃣ Fixed bug: should delete from User, not Official
    await User.findByIdAndDelete(officialId);

    res.status(200).json({ message: "Official deleted successfully" });
  } catch (error) {
    console.error("Delete Official error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @desc Update official details
 */
const updateOfficial = async (req, res) => {
  try {
    const officialId = req.params.id;
    const { firstname, lastname, position, email, username } = req.body;

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

    await official.save();

    res
      .status(200)
      .json({ message: "Official updated successfully", official });
  } catch (error) {
    console.error("Update Official error:", error);
    res.status(500).json({ error: error.message });
  }
};

export {
  createOfficial,
  getAllOfficials,
  getOfficialById,
  resetOfficialPassword,
  deleteOfficial,
  updateOfficial,
};
