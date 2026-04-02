import User from "../models/UserModel.js";
import UserLog from "../models/UserLogModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validateEmail } from "../utils/validateEmail.js";
// Add these imports at the top
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes
//Register a new user
const signupUser = async (req, res) => {
  try {
    let { username, email, password, role, position, firstname, lastname } =
      req.body;

    // sanitize
    username = username?.trim();
    email = email?.trim();
    firstname = firstname?.trim();
    lastname = lastname?.trim();
    role = role ? String(role).trim() : undefined;
    position = position ? String(position).trim() : undefined;

    // validate
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    // if email was provided, make sure it's unique
    if (email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
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
    const finalRole = allowedRoles.includes(role) ? role : "Admin";

    // create user object
    const userData = {
      username,
      password: hashedPassword,
      role: finalRole,
      position: "Admin",
    };
    if (email) userData.email = email; // only include when given

    // include optional names when provided
    if (firstname) userData.firstname = firstname;
    if (lastname) userData.lastname = lastname;

    if (finalRole === "Admin") {
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
        firstname: newUser.firstname || null,
        lastname: newUser.lastname || null,
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
//login user - updated to support username OR email
const signinUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Build query to find user by either username or email
    let query = {};
    if (username) {
      query.username = username;
    } else if (email) {
      query.email = email;
    } else {
      return res.status(400).json({ message: "Username or email is required" });
    }

    const user = await User.findOne(query);

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid username/email or password" });
    }

    if (user.status === "Inactive") {
      return res
        .status(400)
        .json({ message: "User is deactivated, please contact admin" });
    }

    // Auto-unlock if lock time already expired
    if (user.lockUntil && user.lockUntil <= new Date()) {
      user.loginAttempts = 0;
      user.lockUntil = null;
      user.lastLoginAttempt = null;
      await user.save();
    }

    // Check if still locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingTime = Math.ceil(
        (new Date(user.lockUntil).getTime() - Date.now()) / 60000,
      );

      return res.status(423).json({
        message: `Account is locked. Try again in ${remainingTime} minute(s).`,
      });
    }

    const passMatch = await bcrypt.compare(password, user.password);

    if (!passMatch) {
      user.loginAttempts += 1;
      user.lastLoginAttempt = new Date();

      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_TIME);
      }

      await user.save();

      const attemptsLeft = MAX_LOGIN_ATTEMPTS - user.loginAttempts;

      return res.status(400).json({
        message:
          attemptsLeft > 0
            ? `Invalid username/email or password. ${attemptsLeft} attempt(s) remaining.`
            : "Too many failed login attempts. Account locked for 15 minutes.",
      });
    }

    // Reset after successful login
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLoginAttempt = null;
    await user.save();

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET not configured for token generation");
      return res
        .status(500)
        .json({ message: "Authentication configuration error" });
    }

    const token = jwt.sign(
      { _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    try {
      await UserLog.create({
        userId: user._id,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        barangayId: user.barangay,
        role: user.role,
        actionType: "login",
        description: `${user.firstname} ${user.lastname} logged in`,
        ipAddress: req.ip || "Unknown",
        userAgent: req.get("user-agent") || "Unknown",
      });
    } catch (logError) {
      console.error("Error logging login action:", logError);
    }

    return res.status(200).json({
      token,
      user: {
        firstname: user.firstname,
        lastname: user.lastname,
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        barangay: user.barangay,
        position: user.position,
        hasEmail: !!(user.email && user.email.trim()),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}; // create or update  user profile
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
      // ✅ Validate email provider + MX record
      const emailCheck = await validateEmail(email);
      if (!emailCheck.valid) {
        return res.status(400).json({ message: emailCheck.reason });
      }

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
      { new: true }, // return the updated document
    );

    // if user is not found
    if (!updatedProfile) {
      return res.status(404).json({ message: "User not found" });
    }

    // Log the account change
    try {
      const changedFields = Object.keys(update)
        .filter((k) => update[k] !== undefined)
        .join(", ");
      await UserLog.create({
        userId: req.user._id,
        username: req.user.username,
        firstname: req.user.firstname,
        lastname: req.user.lastname,
        barangayId: req.user.barangay,
        role: req.user.role,
        actionType: "account_change",
        description: `Updated profile fields: ${changedFields}`,
        ipAddress: req.ip || "Unknown",
        userAgent: req.get("user-agent") || "Unknown",
      });
    } catch (logError) {
      console.error("Error logging account change:", logError);
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
    const userId = req.user?._id;

    if (!userId) {
      return res
        .status(400)
        .json({ message: "Invalid request. User ID missing." });
    }

    const user = await User.findById(userId)
      .select("-password") // hide password for security
      .populate("barangay");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Profile fetched successfully",
      user,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({
      message: "Server error",
      error: error.message,
    });
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
        description: `Admin deleted user: ${deleted.firstname} ${deleted.lastname} (${deleted.username})`,
        ipAddress: req.ip || "Unknown",
        userAgent: req.get("user-agent") || "Unknown",
      });
    } catch (logError) {
      console.error("Error logging delete_user action:", logError);
      // Don't fail the deletion if logging fails
    }

    res.status(200).json({ message: "User deleted" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Logout user - logs the logout action
const logoutUser = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Log the logout action
    try {
      await UserLog.create({
        userId: user._id,
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        barangayId: user.barangay,
        role: user.role,
        actionType: "logout",
        description: `${user.firstname} ${user.lastname} logged out`,
        ipAddress: req.ip || "Unknown",
        userAgent: req.get("user-agent") || "Unknown",
      });
    } catch (logError) {
      console.error("Error logging logout action:", logError);
      // Don't fail the logout if logging fails
    }

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ error: error.message });
  }
};
// ─────────────────────────────────────────
// STEP 1: User submits email → send OTP
// ─────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Validate email format + provider + MX
    const emailCheck = await validateEmail(email.trim());
    if (!emailCheck.valid) {
      return res.status(400).json({ message: emailCheck.reason });
    }

    const user = await User.findOne({ email: email.trim() });

    // Always return same response — prevents email enumeration
    if (!user) {
      return res.status(200).json({
        message: "If that email is registered, an OTP has been sent.",
      });
    }

    if (user.status === "Inactive") {
      return res.status(400).json({
        message: "Account is deactivated. Please contact admin.",
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store HASHED otp — never store plain OTP
    user.emailOtp = crypto.createHash("sha256").update(otp).digest("hex");
    user.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await user.save();

    await sendEmail({
      to: email,
      subject: "SKActHub — Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">SKActHub</h1>
            <p style="color: #bfdbfe; margin: 4px 0 0;">Password Reset Request</p>
          </div>
          <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 12px 12px; border: 2px solid #e2e8f0;">
            <p style="color: #1e293b; font-size: 15px;">Hi <strong>${user.firstname || user.username}</strong>,</p>
            <p style="color: #475569; font-size: 14px;">Use the OTP below to reset your password. It expires in <strong>10 minutes</strong>.</p>
            <div style="background: white; border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
              <p style="margin: 0 0 8px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Your OTP Code</p>
              <p style="font-size: 42px; font-weight: bold; letter-spacing: 12px; color: #2563eb; margin: 0;">${otp}</p>
            </div>
            <p style="color: #94a3b8; font-size: 13px; text-align: center;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        </div>
      `,
    });

    return res.status(200).json({
      message: "If that email is registered, an OTP has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────
// STEP 2: User submits OTP → get reset token
// ─────────────────────────────────────────
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    const user = await User.findOne({
      email,
      emailOtp: hashedOtp,
      emailOtpExpires: { $gt: new Date() }, // not expired
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // OTP verified — generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Store HASHED token in DB
    user.passwordResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    // Clear OTP — one time use only
    user.emailOtp = null;
    user.emailOtpExpires = null;
    await user.save();

    // Return PLAIN token to frontend
    return res.status(200).json({
      message: "OTP verified successfully",
      resetToken,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────
// STEP 3: User submits new password
// ─────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { resetToken, password, confirmPassword } = req.body;

    if (!resetToken || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Reset token is invalid or has expired",
      });
    }

    // Save new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Clear all reset fields + unlock account
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.loginAttempts = 0;
    user.lockUntil = null;
    user.lastLoginAttempt = null;
    await user.save();

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ error: error.message });
  }
};
// ─────────────────────────────────────────
// Send OTP to verify new email before saving
// ─────────────────────────────────────────
const sendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const userId = req.user._id;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Validate format + provider + MX
    const emailCheck = await validateEmail(email.trim());
    if (!emailCheck.valid) {
      return res.status(400).json({ message: emailCheck.reason });
    }

    // Check if email is already used by another account
    const existing = await User.findOne({ email: email.trim() });
    if (existing && String(existing._id) !== String(userId)) {
      return res
        .status(400)
        .json({ message: "Email is already in use by another account" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store hashed OTP on the user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.emailOtp = crypto.createHash("sha256").update(otp).digest("hex");
    user.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await user.save();

    await sendEmail({
      to: email.trim(),
      subject: "SKActHub — Verify Your Email",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">SKActHub</h1>
            <p style="color: #bfdbfe; margin: 4px 0 0;">Email Verification</p>
          </div>
          <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 12px 12px; border: 2px solid #e2e8f0;">
            <p style="color: #1e293b; font-size: 15px;">Hi <strong>${user.firstname || user.username}</strong>,</p>
            <p style="color: #475569; font-size: 14px;">Use this OTP to verify your email address. It expires in <strong>10 minutes</strong>.</p>
            <div style="background: white; border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
              <p style="margin: 0 0 8px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
              <p style="font-size: 42px; font-weight: bold; letter-spacing: 12px; color: #2563eb; margin: 0;">${otp}</p>
            </div>
            <p style="color: #94a3b8; font-size: 13px; text-align: center;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        </div>
      `,
    });

    return res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("Send email OTP error:", error);
    return res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────
// Verify OTP — marks email as verified in session
// (actual save happens in createProfile)
// ─────────────────────────────────────────
const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const userId = req.user._id;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    const user = await User.findOne({
      _id: userId,
      emailOtp: hashedOtp,
      emailOtpExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Clear OTP — one time use
    user.emailOtp = null;
    user.emailOtpExpires = null;
    await user.save();

    return res.status(200).json({
      message: "Email verified successfully",
      verifiedEmail: email, // frontend stores this to know which email was verified
    });
  } catch (error) {
    console.error("Verify email OTP error:", error);
    return res.status(500).json({ error: error.message });
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
  logoutUser,
  forgotPassword,
  verifyOtp,
  resetPassword,
  sendEmailOtp,
  verifyEmailOtp,
};
