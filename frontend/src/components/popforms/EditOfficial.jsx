import React, { useState, useEffect } from "react";
import axios from "axios";

const EditOfficial = ({ isOpen, onClose, official, onSubmit }) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    firstname: "",
    lastname: "",
    position: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  // Populate form when official prop changes
  useEffect(() => {
    if (official) {
      setFormData({
        username: official.username || "",
        email: official.email || "",
        firstname: official.firstname || "",
        lastname: official.lastname || "",
        position: official.position || "",
        password: "",
        confirmPassword: "",
      });
      setShowPasswordFields(false); // Hide password fields on open
    }
  }, [official]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Only validate password if admin wants to reset it
    if (showPasswordFields && formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Prepare payload
    const payload = { ...formData };
    if (!showPasswordFields) {
      delete payload.password;
      delete payload.confirmPassword;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:5000/api/admins/update-official/${official._id}`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(response.data);
      onSubmit(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
      console.log("1");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        {/* Close button */}
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          ✕
        </button>

        <h2 className="text-xl font-semibold mb-4">Edit Official</h2>
        {error && <p className="text-red-500 mb-2">{error}</p>}

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

          {/* Optional Password Reset */}
          {!showPasswordFields && (
            <button
              type="button"
              onClick={() => setShowPasswordFields(true)}
              className="text-blue-600 hover:underline"
            >
              Reset Password
            </button>
          )}

          {showPasswordFields && (
            <>
              <div>
                <label className="text-sm font-medium">New Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-400 ${
                    error ? "border-red-500" : ""
                  }`}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordFields(false);
                  setFormData({
                    ...formData,
                    password: "",
                    confirmPassword: "",
                  });
                }}
                className="text-red-500 hover:underline mt-1"
              >
                Cancel Password Reset
              </button>
            </>
          )}

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
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditOfficial;
