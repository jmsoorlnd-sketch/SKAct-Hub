import SKPersonnel from "../models/SKPersonnelModel.js";
import Barangay from "../models/BarangayModel.js";
import User from "../models/userModel.js";
import UserLog from "../models/UserLogModel.js";
import mongoose from "mongoose";

const addPersonnelHistory = (skPersonnel, entry) => {
  skPersonnel.history = skPersonnel.history || [];
  skPersonnel.history.push({
    ...entry,
    changedAt: new Date(),
  });
};

const getAccountPositions = async (barangayId) => {
  const accountUsers = await User.find({
    barangay: barangayId,
    role: "Official",
    position: { $in: ["Chairman", "Secretary", "Treasurer"] },
    isDeleted: false,
  }).select("firstname lastname status username position");

  const personFromAccount = (user) => {
    if (!user) return null;
    return {
      surname: user.lastname || "",
      firstName: user.firstname || "",
      middleName: "",
      age: null,
      status: user.status || "Active",
      username: user.username || "",
    };
  };

  return {
    chairman: personFromAccount(
      accountUsers.find((user) => user.position === "Chairman"),
    ),
    secretary: personFromAccount(
      accountUsers.find((user) => user.position === "Secretary"),
    ),
    treasurer: personFromAccount(
      accountUsers.find((user) => user.position === "Treasurer"),
    ),
  };
};

// Get SK Personnel for a barangay
export const getSKPersonnelByBarangay = async (req, res) => {
  try {
    const { barangayId } = req.params;
    const { includeDeleted } = req.query;

    console.log(
      "Received barangayId:",
      barangayId,
      "includeDeleted:",
      includeDeleted,
    );

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

    // If includeDeleted is true, filter and return only deleted kagawad
    if (includeDeleted === "true") {
      const deletedKagawad = skPersonnel.kagawad.filter(
        (k) => k.isDeleted === true,
      );
      return res.status(200).json({ deletedKagawad });
    }

    const accountPositions = await getAccountPositions(barangayId);

    res.status(200).json({ skPersonnel, accountPositions });
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
    const userId = req.user?._id;
    const username = req.user?.username;
    const firstname = req.user?.firstname;
    const lastname = req.user?.lastname;
    const role = req.user?.role;

    if (!mongoose.Types.ObjectId.isValid(barangayId)) {
      return res.status(400).json({ message: "Invalid barangay ID" });
    }

    let skPersonnel = await SKPersonnel.findOne({ barangay: barangayId });
    const isNewAssignment = !skPersonnel?.chairman?.firstName;

    const oldChairman = skPersonnel?.chairman || null;

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
      addPersonnelHistory(skPersonnel, {
        role: "chairman",
        memberId: null,
        name: `${firstName} ${surname}`.trim(),
        status: status || "Active",
        action: "assigned",
        changedBy: { userId, username },
        details: "Initial chairman assignment",
      });
    } else {
      skPersonnel.chairman = {
        surname,
        firstName,
        middleName,
        age,
        status: status || "Active",
      };

      const changes = [];
      if (oldChairman?.surname !== surname) changes.push("surname");
      if (oldChairman?.firstName !== firstName) changes.push("firstName");
      if (oldChairman?.middleName !== middleName) changes.push("middleName");
      if (oldChairman?.age !== age) changes.push("age");
      if (oldChairman?.status !== (status || "Active")) changes.push("status");

      const details =
        changes.length > 0
          ? `Updated fields: ${changes.join(", ")}`
          : "Updated action";

      addPersonnelHistory(skPersonnel, {
        role: "chairman",
        memberId: null,
        name: `${firstName} ${surname}`.trim(),
        status: status || "Active",
        action: "updated",
        changedBy: { userId, username },
        details,
      });
    }

    skPersonnel.updatedAt = new Date();
    await skPersonnel.save();

    const accountPositions = await getAccountPositions(barangayId);

    // Log the action
    if (userId) {
      const actionType = isNewAssignment
        ? "set_sk_personnel"
        : "edit_sk_personnel";
      const description = isNewAssignment
        ? `Set SK Chairman: ${firstName} ${surname}`
        : `Edited SK Chairman: ${firstName} ${surname}`;

      await UserLog.create({
        userId,
        username,
        firstname,
        lastname,
        barangayId,
        role,
        actionType,
        description,
        ipAddress: req.ip || req.connection.remoteAddress || "Unknown",
        userAgent: req.get("user-agent") || "Unknown",
      });
    }

    res.status(200).json({ message: "Chairman updated", skPersonnel, accountPositions });
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
    const userId = req.user?._id;
    const username = req.user?.username;
    const firstname = req.user?.firstname;
    const lastname = req.user?.lastname;
    const role = req.user?.role;

    if (!mongoose.Types.ObjectId.isValid(barangayId)) {
      return res.status(400).json({ message: "Invalid barangay ID" });
    }

    let skPersonnel = await SKPersonnel.findOne({ barangay: barangayId });
    const oldSecretary = skPersonnel?.secretary || null;
    const isNewAssignment = !oldSecretary?.firstName;

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
      addPersonnelHistory(skPersonnel, {
        role: "secretary",
        memberId: null,
        name: `${firstName} ${surname}`.trim(),
        status: status || "Active",
        action: "assigned",
        changedBy: { userId, username },
        details: "Initial secretary assignment",
      });
    } else {
      skPersonnel.secretary = {
        surname,
        firstName,
        middleName,
        age,
        status: status || "Active",
      };
      const changes = [];
      if (oldSecretary?.surname !== surname) changes.push("surname");
      if (oldSecretary?.firstName !== firstName) changes.push("firstName");
      if (oldSecretary?.middleName !== middleName) changes.push("middleName");
      if (oldSecretary?.age !== age) changes.push("age");
      if (oldSecretary?.status !== (status || "Active")) changes.push("status");

      const details =
        changes.length > 0
          ? `Updated fields: ${changes.join(", ")}`
          : "Updated action";

      addPersonnelHistory(skPersonnel, {
        role: "secretary",
        memberId: null,
        name: `${firstName} ${surname}`.trim(),
        status: status || "Active",
        action: "updated",
        changedBy: { userId, username },
        details,
      });
    }

    skPersonnel.updatedAt = new Date();
    await skPersonnel.save();

    const accountPositions = await getAccountPositions(barangayId);

    // Log the action
    if (userId) {
      const actionType = isNewAssignment
        ? "set_sk_personnel"
        : "edit_sk_personnel";
      const description = isNewAssignment
        ? `Set SK Secretary: ${firstName} ${surname}`
        : `Edited SK Secretary: ${firstName} ${surname}`;

      await UserLog.create({
        userId,
        username,
        firstname,
        lastname,
        barangayId,
        role,
        actionType,
        description,
        ipAddress: req.ip || req.connection.remoteAddress || "Unknown",
        userAgent: req.get("user-agent") || "Unknown",
      });
    }

    res.status(200).json({ message: "Secretary updated", skPersonnel, accountPositions });
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
    const userId = req.user?._id;
    const username = req.user?.username;
    const firstname = req.user?.firstname;
    const lastname = req.user?.lastname;
    const role = req.user?.role;

    if (!mongoose.Types.ObjectId.isValid(barangayId)) {
      return res.status(400).json({ message: "Invalid barangay ID" });
    }

    let skPersonnel = await SKPersonnel.findOne({ barangay: barangayId });
    const oldTreasurer = skPersonnel?.treasurer || null;
    const isNewAssignment = !oldTreasurer?.firstName;

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
      addPersonnelHistory(skPersonnel, {
        role: "treasurer",
        memberId: null,
        name: `${firstName} ${surname}`.trim(),
        status: status || "Active",
        action: "assigned",
        changedBy: { userId, username },
        details: "Initial treasurer assignment",
      });
    } else {
      skPersonnel.treasurer = {
        surname,
        firstName,
        middleName,
        age,
        status: status || "Active",
      };

      const changes = [];
      if (oldTreasurer?.surname !== surname) changes.push("surname");
      if (oldTreasurer?.firstName !== firstName) changes.push("firstName");
      if (oldTreasurer?.middleName !== middleName) changes.push("middleName");
      if (oldTreasurer?.age !== age) changes.push("age");
      if (oldTreasurer?.status !== (status || "Active")) changes.push("status");

      const details =
        changes.length > 0
          ? `Updated fields: ${changes.join(", ")}`
          : "Updated action";

      addPersonnelHistory(skPersonnel, {
        role: "treasurer",
        memberId: null,
        name: `${firstName} ${surname}`.trim(),
        status: status || "Active",
        action: "updated",
        changedBy: { userId, username },
        details,
      });
    }

    skPersonnel.updatedAt = new Date();
    await skPersonnel.save();

    const accountPositions = await getAccountPositions(barangayId);

    // Log the action
    if (userId) {
      const actionType = isNewAssignment
        ? "set_sk_personnel"
        : "edit_sk_personnel";
      const description = isNewAssignment
        ? `Set SK Treasurer: ${firstName} ${surname}`
        : `Edited SK Treasurer: ${firstName} ${surname}`;

      await UserLog.create({
        userId,
        username,
        firstname,
        lastname,
        barangayId,
        role,
        actionType,
        description,
        ipAddress: req.ip || req.connection.remoteAddress || "Unknown",
        userAgent: req.get("user-agent") || "Unknown",
      });
    }

    res.status(200).json({ message: "Treasurer updated", skPersonnel, accountPositions });
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
    const userId = req.user?._id;
    const username = req.user?.username;
    const firstname = req.user?.firstname;
    const lastname = req.user?.lastname;
    const role = req.user?.role;

    if (!mongoose.Types.ObjectId.isValid(barangayId)) {
      return res.status(400).json({ message: "Invalid barangay ID" });
    }

    if (!firstName || !surname || !age) {
      return res
        .status(400)
        .json({ message: "Surname, first name and age are required" });
    }

    let skPersonnel = await SKPersonnel.findOne({ barangay: barangayId });

    // Enforce maximum of 7 kagawad members (not counting soft deleted)
    const activeKagawadCount = skPersonnel
      ? skPersonnel.kagawad.filter((k) => !k.isDeleted).length
      : 0;

    if (activeKagawadCount >= 7) {
      return res.status(400).json({
        message: "Kagawad member limit reached (maximum 7 members)",
      });
    }

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

    const newMember = skPersonnel.kagawad[skPersonnel.kagawad.length - 1];
    addPersonnelHistory(skPersonnel, {
      role: "kagawad",
      memberId: newMember._id,
      name: `${newMember.firstName} ${newMember.surname}`.trim(),
      status: newMember.status,
      action: "added",
      changedBy: { userId, username },
      details: "Added new kagawad member",
    });

    skPersonnel.updatedAt = new Date();
    await skPersonnel.save();

    // Log the action
    if (userId) {
      await UserLog.create({
        userId,
        username,
        firstname,
        lastname,
        barangayId,
        role,
        actionType: "set_sk_personnel",
        description: `Added SK Kagawad: ${firstName} ${surname}`,
        ipAddress: req.ip || req.connection.remoteAddress || "Unknown",
        userAgent: req.get("user-agent") || "Unknown",
      });
    }

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
    const userId = req.user?._id;
    const username = req.user?.username;
    const firstname = req.user?.firstname;
    const lastname = req.user?.lastname;
    const role = req.user?.role;

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

    const prevKagawad = { ...kagawad.toObject() };

    if (surname) kagawad.surname = surname;
    if (firstName) kagawad.firstName = firstName;
    if (middleName) kagawad.middleName = middleName;
    if (age) kagawad.age = age;
    if (status) kagawad.status = status;

    const changedFields = [];
    if (prevKagawad.surname !== kagawad.surname) changedFields.push("surname");
    if (prevKagawad.firstName !== kagawad.firstName)
      changedFields.push("firstName");
    if (prevKagawad.middleName !== kagawad.middleName)
      changedFields.push("middleName");
    if (prevKagawad.age !== kagawad.age) changedFields.push("age");
    if (prevKagawad.status !== kagawad.status) changedFields.push("status");

    const details =
      changedFields.length > 0
        ? `Updated fields: ${changedFields.join(", ")}`
        : "Updated action";

    addPersonnelHistory(skPersonnel, {
      role: "kagawad",
      memberId: kagawad._id,
      name: `${kagawad.firstName} ${kagawad.surname}`.trim(),
      status: kagawad.status,
      action: "updated",
      changedBy: { userId, username },
      details,
    });

    skPersonnel.updatedAt = new Date();
    await skPersonnel.save();

    // Log the action
    if (userId) {
      await UserLog.create({
        userId,
        username,
        firstname,
        lastname,
        barangayId,
        role,
        actionType: "edit_sk_personnel",
        description: `Edited SK Kagawad: ${firstName || kagawad.firstName} ${surname || kagawad.surname}`,
        ipAddress: req.ip || req.connection.remoteAddress || "Unknown",
        userAgent: req.get("user-agent") || "Unknown",
      });
    }

    res
      .status(200)
      .json({ message: "Kagawad updated successfully", skPersonnel });
  } catch (error) {
    console.error("Error updating Kagawad:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete Kagawad (soft delete - archive)
export const deleteKagawad = async (req, res) => {
  try {
    const { barangayId, kagawadId } = req.params;
    const userId = req.user?._id;
    const username = req.user?.username;
    const firstname = req.user?.firstname;
    const lastname = req.user?.lastname;
    const role = req.user?.role;

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

    const kagawadToDelete = skPersonnel.kagawad.find(
      (k) => k._id.toString() === kagawadId,
    );

    if (!kagawadToDelete) {
      return res.status(404).json({ message: "Kagawad not found" });
    }

    const deletedName = `${kagawadToDelete.firstName} ${kagawadToDelete.surname}`;

    // Soft delete - mark as deleted instead of removing
    const kagawadIndex = skPersonnel.kagawad.findIndex(
      (k) => k._id.toString() === kagawadId,
    );

    if (kagawadIndex !== -1) {
      skPersonnel.kagawad[kagawadIndex].isDeleted = true;
      skPersonnel.kagawad[kagawadIndex].deletedAt = new Date();
      skPersonnel.kagawad[kagawadIndex].deletedBy = userId;

      addPersonnelHistory(skPersonnel, {
        role: "kagawad",
        memberId: skPersonnel.kagawad[kagawadIndex]._id,
        name: deletedName,
        status: skPersonnel.kagawad[kagawadIndex].status,
        action: "deleted",
        changedBy: { userId, username },
        details: "Soft deleted kagawad member",
      });
    }

    skPersonnel.updatedAt = new Date();
    await skPersonnel.save();

    // Log the action
    if (userId) {
      await UserLog.create({
        userId,
        username,
        firstname,
        lastname,
        barangayId,
        role,
        actionType: "delete_sk_personnel",
        description: `Deleted SK Kagawad: ${deletedName}`,
        ipAddress: req.ip || req.connection.remoteAddress || "Unknown",
        userAgent: req.get("user-agent") || "Unknown",
      });
    }

    res
      .status(200)
      .json({ message: "Kagawad deleted successfully", skPersonnel });
  } catch (error) {
    console.error("Error deleting Kagawad:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Restore Kagawad from archive
export const restoreKagawad = async (req, res) => {
  try {
    const { barangayId, kagawadId } = req.params;
    const userId = req.user?._id;
    const username = req.user?.username;
    const firstname = req.user?.firstname;
    const lastname = req.user?.lastname;
    const role = req.user?.role;

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

    const kagawadToRestore = skPersonnel.kagawad.find(
      (k) => k._id.toString() === kagawadId,
    );

    if (!kagawadToRestore) {
      return res.status(404).json({ message: "Kagawad not found" });
    }

    // Restore by marking as not deleted
    const kagawadIndex = skPersonnel.kagawad.findIndex(
      (k) => k._id.toString() === kagawadId,
    );

    if (kagawadIndex !== -1) {
      skPersonnel.kagawad[kagawadIndex].isDeleted = false;
      skPersonnel.kagawad[kagawadIndex].deletedAt = null;
      skPersonnel.kagawad[kagawadIndex].deletedBy = null;
    }

    skPersonnel.updatedAt = new Date();
    await skPersonnel.save();

    // Log the action
    if (userId) {
      await UserLog.create({
        userId,
        username,
        firstname,
        lastname,
        barangayId,
        role,
        actionType: "restore_sk_personnel",
        description: `Restored SK Kagawad: ${kagawadToRestore.firstName} ${kagawadToRestore.surname}`,
        ipAddress: req.ip || req.connection.remoteAddress || "Unknown",
        userAgent: req.get("user-agent") || "Unknown",
      });
    }

    res
      .status(200)
      .json({ message: "Kagawad restored successfully", skPersonnel });
  } catch (error) {
    console.error("Error restoring Kagawad:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Hard delete Kagawad permanently
export const hardDeleteKagawad = async (req, res) => {
  try {
    const { barangayId, kagawadId } = req.params;
    const userId = req.user?._id;
    const username = req.user?.username;
    const firstname = req.user?.firstname;
    const lastname = req.user?.lastname;
    const role = req.user?.role;

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

    const kagawadToDelete = skPersonnel.kagawad.find(
      (k) => k._id.toString() === kagawadId,
    );

    if (!kagawadToDelete) {
      return res.status(404).json({ message: "Kagawad not found" });
    }

    const kagawadName = `${kagawadToDelete.firstName} ${kagawadToDelete.surname}`;

    // Permanently remove from array
    skPersonnel.kagawad = skPersonnel.kagawad.filter(
      (k) => k._id.toString() !== kagawadId,
    );

    skPersonnel.updatedAt = new Date();
    await skPersonnel.save();

    // Log the action
    if (userId) {
      await UserLog.create({
        userId,
        username,
        firstname,
        lastname,
        barangayId,
        role,
        actionType: "hard_delete_sk_personnel",
        description: `Permanently deleted SK Kagawad: ${kagawadName}`,
        ipAddress: req.ip || req.connection.remoteAddress || "Unknown",
        userAgent: req.get("user-agent") || "Unknown",
      });
    }

    res
      .status(200)
      .json({ message: "Kagawad permanently deleted", skPersonnel });
  } catch (error) {
    console.error("Error permanently deleting Kagawad:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
