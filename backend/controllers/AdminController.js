import jwt from "jsonwebtoken";
import User from "../models/UserModel.js"; // Import the Official Model";
import bcrypt from "bcryptjs";

//admin create official account
const createOfficial = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    //check existing email
    const existEmail = await User.findOne({ email });
    if (existEmail) {
      return res.status(400).json({ message: "Email already exist" });
    }
    //hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    //create new official user
    const newOfficial = await User.create({
      username,
      role: "Official",
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Official registered successfully",
      user: {
        _id: newOfficial.id,
        username: newOfficial.username,
        email: newOfficial.email,
        role: newOfficial.role,
      },
    });
  } catch (error) {
    console.error("Create Official error details:", error);
    res.status(500).json({ error: error.message });
  }
};

//get all officals
const getAllOfficials = async (req, res) => {
  try {
    const officials = await User.find({ role: "Official" }).select("-password");
    res.status(200).json(officials);
  } catch (error) {
    console.error("Get Officials error details:", error);
    res.status(500).json({ error: error.message });
  }
};

//get official by id
const getOfficialById = async (req, res) => {
  try {
    const officialId = req.params.id;
    const official = await User.findById(officialId).select("-password");
    if (!official || official.role !== "Official") {
      return res.status(404).json({ message: "Official not found" });
    }
    res.status(200).json(official);
  } catch (error) {
    console.error("Get Official by ID error details:", error);
    res.status(500).json({ error: error.message });
  }
};

//reset official password
const resetOfficialPassword = async (req, res) => {
  try {
    const officialId = req.params.id;
    const { newPassword } = req.body;
    const official = await User.findById(officialId);
    if (!official || official.role !== "Official") {
      return res.status(404).json({ message: "Official not found" });
    }
    //hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    official.password = hashedPassword;
    await official.save();
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset Official Password error details:", error);
    res.status(500).json({ error: error.message });
  }
};

// delete official
const deleteOfficial = async (req, res) => {
  try {
    const officialId = req.params.id;
    const official = await User.findById(officialId);
    if (!official || official.role !== "Official") {
      return res.status(404).json({ message: "Official not found" });
    }
    await Official.findByIdAndDelete(officialId);
    res.status(200).json({ message: "Official deleted successfully" });
  } catch (error) {
    console.error("Delete Official error details:", error);
    res.status(500).json({ error: error.message });
  }
};

//update official details
const updateOfficial = async (req, res) => {
  try {
    const officialId = req.params.id;
    const { firstname, lastname, position, email } = req.body;

    const official = await User.findById(officialId);
    if (!official || official.role !== "Official") {
      return res.status(404).json({ message: "Official not found" });
    }
    official.firstname = firstname || official.firstname;
    official.lastname = lastname || official.lastname;
    official.position = position || official.position;
    official.email = email || official.email;

    await official.save();
    res.status(200).json({ message: "Official updated successfully" });
  } catch (error) {
    console.error("Update Official error details:", error);
    res.status(500).json({ error: error.message });
  }
};

export default {
  createOfficial,
  getAllOfficials,
  getOfficialById,
  resetOfficialPassword,
  deleteOfficial,
  updateOfficial,
};
