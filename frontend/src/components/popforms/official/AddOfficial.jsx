import React, { useEffect, useState } from "react";
import axios from "axios";

const CreateOfficialModal = ({ isOpen, onClose, onSubmit }) => {
  const [barangays, setBarangays] = useState([]);
  const [formData, setFormData] = useState({
    firstname: "",
    email: "",
    lastname: "",
    position: "",
    username: "",
    password: "",
    barangay: "",
    confirmPassword: "",
    role: "Official",
    status: "Active",
  });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    // 🔥 2. VALIDATE PASSWORD LENGTH
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    const token = localStorage.getItem("token");
    setIsSubmitting(true);

    try {
      // Remove confirmPassword before sending to backend
      const { confirmPassword, ...submitData } = formData;

      const response = await axios.post(
        "http://localhost:5000/api/admins/create-official",
        submitData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Success:", response.data);

      // Pass the created official back to parent
      onSubmit(response.data.user);

      // Reset form
      setFormData({
        firstname: "",
        email: "",
        lastname: "",
        position: "",
        username: "",
        password: "",
        barangay: "",
        confirmPassword: "",
        role: "Official",
        status: "Active",
      });

      onClose(); // close modal
    } catch (error) {
      console.error("Error details:", error.response?.data || error);
      setError(
        error.response?.data?.message ||
          "Failed to create official. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  //fetch barangays
  useEffect(() => {
    const fetchBarangays = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/barangays/all-barangays",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setBarangays(res.data.barangays || []);
      } catch (error) {
        console.error("Failed to fetch barangays:", error);
      }
    };
    fetchBarangays();
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-black/50 items-center justify-center">
      <div className="relative z-10 bg-white w-full max-w-md rounded-lg shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4 text-blue-700">
          Create SK Official
        </h2>

        {/* 🔥 ERROR MESSAGE */}
        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* First + Last Name */}
          <div className="flex gap-3">
            <div className="w-1/2">
              <label className="text-sm font-medium block">Firstname</label>
              <input
                type="text"
                name="firstname"
                value={formData.firstname}
                onChange={handleChange}
                required
                className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
            </div>

            <div className="w-1/2">
              <label className="text-sm font-medium block">Lastname</label>
              <input
                type="text"
                name="lastname"
                value={formData.lastname}
                onChange={handleChange}
                required
                className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Position */}
          <div>
            <label className="text-sm font-medium block">Position</label>
            <select
              name="position"
              value={formData.position}
              onChange={handleChange}
              required
              className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              <option value="">Select Position</option>
              <option value="Chairman">Chairman</option>
              <option value="Secretary">Secretary</option>
              <option value="Treasurer">Treasurer</option>
            </select>
          </div>

          {/* Barangay */}
          <div>
            <label className="text-sm font-medium block">Barangay</label>
            <select
              name="barangay"
              value={formData.barangay}
              onChange={handleChange}
              required
              className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              <option value="">Select Barangay</option>
              {barangays.map((barangay) => (
                <option key={barangay._id} value={barangay._id}>
                  {barangay.barangayName}
                </option>
              ))}
            </select>
          </div>

          {/* Username */}
          <div>
            <label className="text-sm font-medium block">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium block">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-sm font-medium block">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
              className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-sm font-medium block">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className={`w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none ${
                error && error.includes("match") ? "border-red-500" : ""
              }`}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={() => {
                onClose();
                setError("");
              }}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-md border hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOfficialModal;
