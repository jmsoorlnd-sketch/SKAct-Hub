import React from "react";
import axios from "axios";
import { useState } from "react";

const Signup = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    role: "",
    password: "",
    confirmpass: "",
  });
  const { username, email, role, password, confirmpass } = formData;
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = async (e) => {
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

    try {
      const res = await axios.post(
        "http://localhost:5000/api/users/signup",
        formData
      );
      setSuccess("Signup successful! You can now login.");
      window.location.href = "/";
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <form
      className="
        max-w-[400px] mx-auto my-[10rem] p-[3rem] 
        rounded-[3px] shadow-[0_4px_8px_rgba(0,0,0,0.4)] 
        flex flex-col gap-[1.5rem]
      "
      onSubmit={handleSubmit}
    >
      <h1 className="text-2xl font-bold text-center">Signup</h1>

      <div className="flex flex-col">
        <label>Username</label>
        <input
          type="text"
          name="username"
          value={username}
          required
          onChange={handleChange}
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
        />
      </div>

      <div className="flex flex-col">
        <label>Role</label>
        <select name="role" value={role} required onChange={handleChange}>
          <option value="">-- Select --</option>
          <option value="Admin">Admin</option>
          <option value="Chairman">Chairman</option>
          <option value="Treasurer">Treasurer</option>
          <option value="Secretary">Secretary</option>
        </select>
      </div>

      <div className="flex flex-col">
        <label>Password</label>
        <input
          type="text"
          name="password"
          value={password}
          onChange={handleChange}
        />
      </div>

      <div className="flex flex-col">
        <label>Confirm Password</label>
        <input
          type="text"
          name="confirmpass"
          value={confirmpass}
          onChange={handleChange}
        />
      </div>

      <button type="submit" className="bg-blue-600 text-white py-2 rounded">
        Create
      </button>

      {/* BACK BUTTON — SMALL, LEFT SIDE */}
      <button
        type="button"
        onClick={() => (window.location.href = "/")}
        className="text-sm text-blue-600 underline w-fit"
      >
        ← Back to Login
      </button>
    </form>
  );
};

export default Signup;
