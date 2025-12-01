import Barangay from "../models/BarangayModel.js";
import User from "../models/UserModel.js";
import BarangayStorage from "../models/BarangayStorageModel.js";

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

    if (!barangayName || !city || !province || !region) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newBarangay = await Barangay.create({
      barangayName,
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
