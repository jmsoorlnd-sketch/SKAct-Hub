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

      console.log(res.data);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      alert("Login successful!");
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Login failed:", error);
      alert(error.response?.data?.message || "Login failed. Please try again.");
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
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-semibold">Username</label>
          <input
            type="text"
            required
            name="username"
            value={username}
            onChange={handleChange}
            className="border rounded-md p-2 w-full"
          />
        </div>

        {/* Password */}
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-semibold">Password</label>
          <input
            type="password"
            required
            name="password"
            value={password}
            onChange={handleChange}
            className="border rounded-md p-2 w-full"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md w-full transition"
        >
          Submit
        </button>

        {/* Forgot Password */}
        <a
          className="text-center text-[#374151] hover:underline cursor-pointer"
          href="#"
        >
          Forgot Password
        </a>

        {/* Register Link */}
        <p className="text-center text-sm border-t pt-3">
          Don’t have an account?{" "}
          <a href="/signup" className="text-blue-600 hover:underline">
            Register
          </a>
        </p>
      </form>
    </div>
  );
};

export default Signin;
