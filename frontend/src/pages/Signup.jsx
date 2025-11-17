import React, { useState } from "react";
import axios from "axios";

const Signup = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    role: "",
    password: "",
    confirmpass: "",
    adminkey: "",
  });

  const { username, email, role, password, confirmpass, adminkey } = formData;

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmpass) {
      setError("Passwords do not match");
      return;
    }

    if (role === "Admin" && adminkey !== "MY_SECRET_ADMIN_KEY") {
      setError("Invalid Admin Key");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/users/signup", formData);

      setSuccess("Signup successful! You can now login.");
      window.location.href = "/";
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        className="
          w-[400px] bg-white p-[3rem]
          rounded-[8px] shadow-xl
          flex flex-col gap-[1.5rem]
        "
        onSubmit={handleSubmit}
      >
        <h1 className="text-2xl font-bold text-center">Signup</h1>

        {error && <p className="text-red-600">{error}</p>}
        {success && <p className="text-green-600">{success}</p>}

        <div className="flex flex-col">
          <label>Username</label>
          <input
            type="text"
            name="username"
            value={username}
            required
            onChange={handleChange}
            className="border p-2 rounded"
          />
        </div>

        <div className="flex flex-col">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={email}
            required
            onChange={handleChange}
            className="border p-2 rounded"
          />
        </div>

        <div className="flex flex-col">
          <label>Role</label>
          <select
            name="role"
            value={role}
            required
            onChange={handleChange}
            className="border p-2 rounded"
          >
            <option value="">-- Select --</option>
            <option value="Admin">Admin</option>
            <option value="Chairman">Chairman</option>
            <option value="Treasurer">Treasurer</option>
            <option value="Secretary">Secretary</option>
          </select>
        </div>

        {/* Show admin key only for Admin role */}
        {role === "Admin" && (
          <div className="flex flex-col">
            <label>Admin Key</label>
            <input
              type="text"
              name="adminkey"
              value={adminkey}
              onChange={handleChange}
              required
              className="border p-2 rounded"
              placeholder="Enter Admin Secret Key"
            />
          </div>
        )}

        <div className="flex flex-col">
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={password}
            onChange={handleChange}
            className="border p-2 rounded"
          />
        </div>

        <div className="flex flex-col">
          <label>Confirm Password</label>
          <input
            type="password"
            name="confirmpass"
            value={confirmpass}
            onChange={handleChange}
            className="border p-2 rounded"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Create
        </button>

        <button
          type="button"
          onClick={() => (window.location.href = "/")}
          className="text-sm text-blue-600 underline w-fit"
        >
          ← Back to Login
        </button>
      </form>
    </div>
  );
};

export default Signup;
