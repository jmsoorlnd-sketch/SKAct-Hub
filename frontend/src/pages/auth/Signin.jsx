import { useState } from "react";
import axios from "axios";

const Signin = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const { username, password } = formData;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:5000/api/users/signin", {
        username,
        password,
      });

      const { user, token } = res.data;

      // store token + user info
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      console.log(res.data.user);

      alert("Login successful!");

      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Login failed:", error);
      alert(error.response?.data?.message || "Login failed.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="w-[400px] bg-white p-10 rounded-xl shadow-lg flex flex-col gap-6"
      >
        <h1 className="text-2xl font-bold text-center">Signin</h1>

        {/* Username */}
        <input
          type="text"
          name="username"
          value={username}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />

        {/* Password */}
        <input
          type="password"
          name="password"
          value={password}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />

        <button className="bg-blue-600 text-white p-2 rounded">Login</button>
      </form>
    </div>
  );
};

export default Signin;
