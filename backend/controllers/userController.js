import User from "../models/UserModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

//Register a new user
const signupUser = async (req, res) => {
  try {
    let { username, email, password, role, position } = req.body;

    // sanitize
    username = username?.trim();
    email = email?.trim();
    role = role ? String(role).trim() : undefined;
    position = position ? String(position).trim() : undefined;

    // validate
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email and password are required",
      });
    }

    // check existing email
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // check existing username
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({
        success: false,
        message: "Username already exists",
      });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // determine role (default to Youth)
    const allowedRoles = ["Youth", "Official", "Admin"];
    const finalRole = allowedRoles.includes(role) ? role : "Youth";

    // create user object
    const userData = {
      username,
      email,
      password: hashedPassword,
      role: finalRole,
    };

    // attach position only when Official
    if (finalRole === "Official" && position) {
      userData.position = position;
    }

    const newUser = await User.create(userData);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        _id: newUser._id,
        email,
        username,
        role: newUser.role,
        position: newUser.position || null,
      },
    });
  } catch (error) {
    console.error("Signup Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

//login user
const signinUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Invalid username or password" });
    }
    if (user.status == "Inactive") {
      return res
        .status(400)
        .json({ message: "User is deactivated, please contact admin" });
    }

    const passMatch = await bcrypt.compare(password, user.password);
    if (!passMatch) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    // generate token
    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// create or update  user profile
const createProfile = async (req, res) => {
  try {
    // get the user ID from the verified JWT token (middleware adds this)
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized: No user found" });
    }

    // destructure profile fields from request body
    let {
      firstname,
      lastname,
      email,
      role,
      age,
      address,
      username,
      password,
      civil,
      barangayName,
    } = req.body;

    // sanitize
    firstname = firstname?.trim();
    lastname = lastname?.trim();
    email = email?.trim();
    username = username?.trim();
    barangayName = barangayName?.trim();

    // prepare update object
    const update = {};
    if (firstname !== undefined) update.firstname = firstname;
    if (lastname !== undefined) update.lastname = lastname;
    if (email !== undefined) update.email = email;
    if (role !== undefined) update.role = role;
    if (age !== undefined) update.age = age;
    if (address !== undefined) update.address = address;
    if (civil !== undefined) update.civil = civil;
    if (barangayName !== undefined) update.barangayName = barangayName;

    // handle username change: ensure uniqueness
    if (username) {
      const existing = await User.findOne({ username });
      if (existing && String(existing._id) !== String(userId)) {
        return res.status(400).json({ message: "Username already in use" });
      }
      update.username = username;
    }

    // handle email change: ensure uniqueness
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail && String(existingEmail._id) !== String(userId)) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    // handle password change
    if (password && String(password).trim().length > 0) {
      const hashed = await bcrypt.hash(String(password), 10);
      update.password = hashed;
    }

    // update or create user profile
    const updatedProfile = await User.findByIdAndUpdate(
      userId, // find by _id
      update, // update data
      { new: true } // return the updated document
    );

    // if user is not found
    if (!updatedProfile) {
      return res.status(404).json({ message: "User not found" });
    }

    // success response
    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedProfile,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//get profile
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//find other profile
const getProfileById = async (req, res) => {
  try {
    const userId = req.params._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//get all profile
const getAllProfile = async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// delete user (admin only)
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) return res.status(400).json({ message: "User id required" });

    const deleted = await User.findByIdAndDelete(userId);
    if (!deleted) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "User deleted" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export {
  signupUser,
  signinUser,
  createProfile,
  getUserProfile,
  getProfileById,
  getAllProfile,
  deleteUser,
};
