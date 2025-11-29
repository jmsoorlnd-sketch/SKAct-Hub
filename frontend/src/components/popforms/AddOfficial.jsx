import React, { useState } from "react";
import axios from "axios";

const CreateOfficialModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    firstname: "",
    email: "",
    lastname: "",
    position: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "Official",
    status: "Active",
  });

  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🔥 1. VALIDATE PASSWORD MATCH
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // 🔥 2. VALIDATE PASSWORD LENGTH (professional)
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    const token = localStorage.getItem("token");

    try {
      const response = await axios.post(
        "http://localhost:5000/api/admins/addofficial",
        formData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      onSubmit(formData);
      onClose(); // close modal
    } catch (error) {
      console.error(error);
      setError("Failed to create official. Try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black/50 items-center justify-center pointer-events-none">
      {/* <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"></div> */}

      <div className="relative z-10 bg-white w-full max-w-md rounded-lg shadow-xl p-6 pointer-events-auto">
        <h2 className="text-xl font-semibold mb-4 text-blue-700">
          Create SK Official
        </h2>

        {/* 🔥 ERROR MESSAGE */}
        {error && (
          <p className="mb-3 text-red-600 text-sm font-medium">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First + Last Name */}
          <div className="flex gap-3">
            <div className="w-1/2">
              <label className="text-sm font-medium">Firstname</label>
              <input
                type="text"
                name="firstname"
                value={formData.firstname}
                onChange={handleChange}
                required
                className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-400"
              />
            </div>

            <div className="w-1/2">
              <label className="text-sm font-medium">Lastname</label>
              <input
                type="text"
                name="lastname"
                value={formData.lastname}
                onChange={handleChange}
                required
                className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          {/* Position */}
          <div>
            <label className="text-sm font-medium">Position</label>
            <select
              name="position"
              value={formData.position}
              onChange={handleChange}
              required
              className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Select Position</option>
              <option value="Chairman">Chairman</option>
              <option value="Secretary">Secretary</option>
              <option value="Treasurer">Treasurer</option>
            </select>
          </div>

          {/* Username */}
          <div>
            <label className="text-sm font-medium">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Confirm Password (PROFESSIONAL WAY) */}
          <div>
            <label className="text-sm font-medium">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className={`w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 ${
                error ? "border-red-500" : ""
              }`}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOfficialModal;
