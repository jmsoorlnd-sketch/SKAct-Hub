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
    role: "Official",
  });

  const { firstname, email, lastname, position, username, password } = formData;
  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    console.log("Sending token:", token);

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
      console.log(response.data);
      console.log("Form Data:", formData);
      onSubmit(formData); // pass data to parent
      onClose(); // close modal
    } catch (error) {
      console.error(error);
      console.log(token);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white w-full max-w-md rounded-lg shadow-xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-blue-700">
          Create SK Official
        </h2>

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

          {/* email */}
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="text"
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

          {/* Buttons */}
          <div className="flex justify-end gap-3 mt-6">
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
