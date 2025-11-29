import { useState, useEffect, useRef } from "react";
import axios from "axios";

const Signin = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const { username, password } = formData;

  const usernameRef = useRef(null);
  const passwordRef = useRef(null);

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

      // Redirect based on role
      const role = String(user?.role || "")
        .trim()
        .toLowerCase();
      if (role === "admin") {
        window.location.href = "/admin-dashboard";
      } else if (role === "official") {
        window.location.href = "/official-dashboard";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (error) {
      alert(error.response?.data?.message || "Login failed.");
    }
  };

  // Sync potential browser autofill values into React state
  useEffect(() => {
    const syncAutofill = () => {
      const u = usernameRef.current?.value || "";
      const p = passwordRef.current?.value || "";
      setFormData((prev) => ({
        username: prev.username || u,
        password: prev.password || p,
      }));
    };

    // run once after mount and again shortly after to catch autofill
    syncAutofill();
    const id = setTimeout(syncAutofill, 250);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 flex">
        {/* LEFT SIDE */}
        <div className="w-1/2 p-16 text-white flex flex-col justify-center bg-linear-to-br from-blue-500 to-blue-700">
          <h1 className="text-6xl font-bold mb-6">Welcome! to SKAct-Hub</h1>
          <p className="text-lg opacity-90 mb-10">kiko</p>

          <a
            href="#"
            className="text-white underline text-lg hover:opacity-80 transition"
          >
            Learn More
          </a>
        </div>

        {/* RIGHT SIDE */}
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
              ref={usernameRef}
              value={username}
              onInput={(e) => handleChange(e)}
              onChange={(e) => {
                console.debug("Signin: username change", e.target.value);
                handleChange(e);
              }}
              onFocus={() => console.debug("Signin: username focus")}
              autoComplete="username"
              required
              className="w-full px-4 py-3 rounded-xl bg-white/90 text-black text-lg text-left placeholder-gray-500 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 transition mb-10"
              placeholder="Enter username"
            />

            {/* PASSWORD */}
            <label className="text-white text-sm font-semibold block mb-3">
              Password
            </label>
            <input
              type="password"
              name="password"
              ref={passwordRef}
              value={password}
              onInput={(e) => handleChange(e)}
              onChange={(e) => {
                console.debug(
                  "Signin: password change",
                  e.target.value ? "(chars)" : ""
                );
                handleChange(e);
              }}
              onFocus={() => console.debug("Signin: password focus")}
              autoComplete="current-password"
              required
              className="w-full px-4 py-3 rounded-xl bg-white/90 text-black text-lg text-left placeholder-gray-500 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 transition mb-16"
              placeholder="Enter password"
            />

            {/* SUBMIT BUTTON (UPDATED PADDING) */}
            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-blue-600 text-white text-lg font-semibold shadow hover:scale-105 transition-all"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signin;
