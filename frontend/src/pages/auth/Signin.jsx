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

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      console.log(res.data.user);

      alert("Login successful!");

      window.location.href = "/dashboard";
    } catch (error) {
      alert(error.response?.data?.message || "Login failed.");
    }
  };

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 flex">
        {/* LEFT SIDE */}
        <div className="w-1/2 p-16 text-white flex flex-col justify-center bg-linear-to-br from-blue-500 to-blue-700">
          <h1 className="text-6xl font-bold mb-6">Welcome!</h1>
          <p className="text-lg opacity-90 mb-10">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </p>

          <a
            href="#"
            className="text-white underline text-lg hover:opacity-80 transition"
          >
            Learn More
          </a>
        </div>

        {/* RIGHT SIDE (SIGN IN CARD) */}
        <div className="w-1/2 p-16 flex flex-col justify-center bg-linear-to-br from-blue-300/40 to-blue-400/40 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
            <h2 className="text-4xl text-white font-bold text-center mb-12">
              Sign In
            </h2>

            {/* USERNAME */}
            <label className="text-white text-sm font-semibold block mb-3">
              User Name
            </label>
            <input
              type="text"
              name="username"
              value={username}
              onChange={handleChange}
              required
              className="w-full px-6 py-4 rounded-xl bg-white/20 text-white text-lg text-center placeholder-white/70 border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white/30 transition mb-10"
              placeholder="Enter username"
            />

            {/* PASSWORD */}
            <label className="text-white text-sm font-semibold block mb-3">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={handleChange}
              required
              className="w-full px-6 py-4 rounded-xl bg-white/20 text-white text-lg text-center placeholder-white/70 border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:bg-white/30 transition mb-12"
              placeholder="Enter password"
            />

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-linear-to-r from-blue-300 to-blue-600 text-white text-xl font-bold shadow-xl hover:scale-105 transition-all"
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signin;
