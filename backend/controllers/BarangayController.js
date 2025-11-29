import Barangay from "../models/BarangayModel.js";
import User from "../models/UserModel.js";
import BarangayStorage from "../models/BarangayStorageModel.js";

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
    const { barangay, city, province, region } = req.body;

    if (!barangay || !city || !province || !region) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newBarangay = await Barangay.create({
      barangay,
      city,
      province,
      region,
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

    const user = await User.findByIdAndUpdate(
      userId,
      { barangay: barangayId },
      { new: true }
    );

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

// Get barangay storage (documents)
export const getBarangayStorage = async (req, res) => {
  try {
    const { barangayId } = req.params;

    const storage = await BarangayStorage.find({ barangay: barangayId })
      .populate("uploadedBy", "username firstname lastname")
      .populate("document")
      .sort({ createdAt: -1 });

    res.status(200).json({ storage });
  } catch (error) {
    console.error("Error fetching storage:", error);
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

    const user = await User.findById(userId);
    if (!user || !user.barangay) {
      return res
        .status(404)
        .json({ message: "User not assigned to any barangay" });
    }

    const storage = await BarangayStorage.find({ barangay: user.barangay })
      .populate("uploadedBy", "username firstname lastname")
      .populate("document")
      .sort({ createdAt: -1 });

    res.status(200).json({ storage });
  } catch (error) {
    console.error("Error fetching storage:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
