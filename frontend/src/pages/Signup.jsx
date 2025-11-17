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

    // signup logic here
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
      console.log(res.data);
      console.log("naay guba");
      window.location.href = "/";
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message); // backend error
        console.log("naay guba");
      } else {
        setError("Something went wrong. Please try again.");
        console.log("asd");
      }
    }
  };
  return (
    <form
      className="
    max-w-[400px] mx-auto my-[10rem] p-[3rem]  rounded-[3px] shadow-[0_4px_8px_rgba(0,0,0,0.4)] flex flex-col gap-[1.5rem]"
      onSubmit={handleSubmit}
    >
      <h1 className="text-2xl font-bold text-center">Signup</h1>
      {/* username */}
      <div className="flex flex-col">
        <label htmlFor="">Username</label>
        <input
          type="text"
          name="username"
          value={username}
          required
          onChange={handleChange}
        />
      </div>
      {/* email */}
      <div className="flex flex-col">
        <label htmlFor="">Email</label>
        <input
          type="email"
          name="email"
          value={email}
          required
          onChange={handleChange}
        />
      </div>
      {/* role */}
      <div className="flex flex-col">
        <label htmlFor="">Role</label>
        <select name="role" value={role} required onChange={handleChange} id="">
          <option value="">-- Select --</option>
          <option value="Admin">Admin</option>
          <option value="Chairman">Chairman</option>
          <option value="Treasurer">Treasurer</option>
          <option value="Secretary">Secretary</option>
        </select>{" "}
      </div>
      {/* password */}
      <div className="flex flex-col">
        <label htmlFor="">Password</label>
        <input
          type="text"
          name="password"
          value={password}
          onChange={handleChange}
        />
      </div>
      {/* confirm password */}
      <div className="flex flex-col">
        <label htmlFor="">Confirm Password</label>
        <input
          type="text"
          name="confirmpass"
          value={confirmpass}
          onChange={handleChange}
        />
      </div>
      <button type="submit">Create</button>
    </form>
  );
};

export default Signup;
