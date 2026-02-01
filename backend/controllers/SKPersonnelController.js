import SKPersonnel from "../models/SKPersonnelModel.js";
import Barangay from "../models/BarangayModel.js";
import mongoose from "mongoose";

// Get SK Personnel for a barangay
export const getSKPersonnelByBarangay = async (req, res) => {
  try {
    const { barangayId } = req.params;

    console.log("Received barangayId:", barangayId);

    if (!barangayId) {
      return res.status(400).json({ message: "Barangay ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(barangayId)) {
      return res.status(400).json({ message: "Invalid barangay ID format" });
    }

    let skPersonnel = await SKPersonnel.findOne({ barangay: barangayId });

    if (!skPersonnel) {
      // Create a new record if it doesn't exist
      skPersonnel = new SKPersonnel({
        barangay: barangayId,
        chairman: {
          surname: "",
          firstName: "",
          middleName: "",
          age: null,
          status: "Active",
        },
        secretary: {
          surname: "",
          firstName: "",
          middleName: "",
          age: null,
          status: "Active",
        },
        treasurer: {
          surname: "",
          firstName: "",
          middleName: "",
          age: null,
          status: "Active",
        },
        kagawad: [],
      });
      await skPersonnel.save();
    }

    res.status(200).json({ skPersonnel });
  } catch (error) {
    console.error("Error fetching SK Personnel:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Chairman
export const updateChairman = async (req, res) => {
  try {
    const { barangayId } = req.params;
    const { surname, firstName, middleName, age, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(barangayId)) {
      return res.status(400).json({ message: "Invalid barangay ID" });
    }

    let skPersonnel = await SKPersonnel.findOne({ barangay: barangayId });

    if (!skPersonnel) {
      skPersonnel = new SKPersonnel({
        barangay: barangayId,
        chairman: {
          surname,
          firstName,
          middleName,
          age,
          status: status || "Active",
        },
        secretary: {
          surname: "",
          firstName: "",
          middleName: "",
          age: null,
          status: "Active",
        },
        treasurer: {
          surname: "",
          firstName: "",
          middleName: "",
          age: null,
          status: "Active",
        },
        kagawad: [],
      });
    } else {
      skPersonnel.chairman = {
        surname,
        firstName,
        middleName,
        age,
        status: status || "Active",
      };
    }

    skPersonnel.updatedAt = new Date();
    await skPersonnel.save();

    res.status(200).json({ message: "Chairman updated", skPersonnel });
  } catch (error) {
    console.error("Error updating Chairman:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Secretary (was Vice President)
export const updateSecretary = async (req, res) => {
  try {
    const { barangayId } = req.params;
    const { surname, firstName, middleName, age, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(barangayId)) {
      return res.status(400).json({ message: "Invalid barangay ID" });
    }

    let skPersonnel = await SKPersonnel.findOne({ barangay: barangayId });

    if (!skPersonnel) {
      skPersonnel = new SKPersonnel({
        barangay: barangayId,
        chairman: {
          surname: "",
          firstName: "",
          middleName: "",
          age: null,
          status: "Active",
        },
        secretary: {
          surname,
          firstName,
          middleName,
          age,
          status: status || "Active",
        },
        treasurer: {
          surname: "",
          firstName: "",
          middleName: "",
          age: null,
          status: "Active",
        },
        kagawad: [],
      });
    } else {
      skPersonnel.secretary = {
        surname,
        firstName,
        middleName,
        age,
        status: status || "Active",
      };
    }

    skPersonnel.updatedAt = new Date();
    await skPersonnel.save();

    res.status(200).json({ message: "Secretary updated", skPersonnel });
  } catch (error) {
    console.error("Error updating Secretary:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Treasurer
export const updateTreasurer = async (req, res) => {
  try {
    const { barangayId } = req.params;
    const { surname, firstName, middleName, age, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(barangayId)) {
      return res.status(400).json({ message: "Invalid barangay ID" });
    }

    let skPersonnel = await SKPersonnel.findOne({ barangay: barangayId });

    if (!skPersonnel) {
      skPersonnel = new SKPersonnel({
        barangay: barangayId,
        chairman: {
          surname: "",
          firstName: "",
          middleName: "",
          age: null,
          status: "Active",
        },
        secretary: {
          surname: "",
          firstName: "",
          middleName: "",
          age: null,
          status: "Active",
        },
        treasurer: {
          surname,
          firstName,
          middleName,
          age,
          status: status || "Active",
        },
        kagawad: [],
      });
    } else {
      skPersonnel.treasurer = {
        surname,
        firstName,
        middleName,
        age,
        status: status || "Active",
      };
    }

    skPersonnel.updatedAt = new Date();
    await skPersonnel.save();

    res.status(200).json({ message: "Treasurer updated", skPersonnel });
  } catch (error) {
    console.error("Error updating Treasurer:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Add Kagawad
export const addKagawad = async (req, res) => {
  try {
    const { barangayId } = req.params;
    const { surname, firstName, middleName, age, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(barangayId)) {
      return res.status(400).json({ message: "Invalid barangay ID" });
    }

    if (!firstName || !surname || !age) {
      return res
        .status(400)
        .json({ message: "Surname, first name and age are required" });
    }

    let skPersonnel = await SKPersonnel.findOne({ barangay: barangayId });

    if (!skPersonnel) {
      skPersonnel = new SKPersonnel({
        barangay: barangayId,
        chairman: {
          surname: "",
          firstName: "",
          middleName: "",
          age: null,
          status: "Active",
        },
        secretary: {
          surname: "",
          firstName: "",
          middleName: "",
          age: null,
          status: "Active",
        },
        treasurer: {
          surname: "",
          firstName: "",
          middleName: "",
          age: null,
          status: "Active",
        },
        kagawad: [
          {
            _id: new mongoose.Types.ObjectId(),
            surname,
            firstName,
            middleName,
            age,
            status: status || "Active",
          },
        ],
      });
    } else {
      skPersonnel.kagawad.push({
        _id: new mongoose.Types.ObjectId(),
        surname,
        firstName,
        middleName,
        age,
        status: status || "Active",
      });
    }

    skPersonnel.updatedAt = new Date();
    await skPersonnel.save();

    res
      .status(201)
      .json({ message: "Kagawad added successfully", skPersonnel });
  } catch (error) {
    console.error("Error adding Kagawad:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Kagawad
export const updateKagawad = async (req, res) => {
  try {
    const { barangayId, kagawadId } = req.params;
    const { surname, firstName, middleName, age, status } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(barangayId) ||
      !mongoose.Types.ObjectId.isValid(kagawadId)
    ) {
      return res.status(400).json({ message: "Invalid IDs" });
    }

    const skPersonnel = await SKPersonnel.findOne({ barangay: barangayId });

    if (!skPersonnel) {
      return res.status(404).json({ message: "SK Personnel record not found" });
    }

    const kagawad = skPersonnel.kagawad.find(
      (k) => k._id.toString() === kagawadId,
    );

    if (!kagawad) {
      return res.status(404).json({ message: "Kagawad not found" });
    }

    if (surname) kagawad.surname = surname;
    if (firstName) kagawad.firstName = firstName;
    if (middleName) kagawad.middleName = middleName;
    if (age) kagawad.age = age;
    if (status) kagawad.status = status;

    skPersonnel.updatedAt = new Date();
    await skPersonnel.save();

    res
      .status(200)
      .json({ message: "Kagawad updated successfully", skPersonnel });
  } catch (error) {
    console.error("Error updating Kagawad:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete Kagawad
export const deleteKagawad = async (req, res) => {
  try {
    const { barangayId, kagawadId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(barangayId) ||
      !mongoose.Types.ObjectId.isValid(kagawadId)
    ) {
      return res.status(400).json({ message: "Invalid IDs" });
    }

    const skPersonnel = await SKPersonnel.findOne({ barangay: barangayId });

    if (!skPersonnel) {
      return res.status(404).json({ message: "SK Personnel record not found" });
    }

    skPersonnel.kagawad = skPersonnel.kagawad.filter(
      (k) => k._id.toString() !== kagawadId,
    );

    skPersonnel.updatedAt = new Date();
    await skPersonnel.save();

    res
      .status(200)
      .json({ message: "Kagawad deleted successfully", skPersonnel });
  } catch (error) {
    console.error("Error deleting Kagawad:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
