import { useState, useEffect, useRef } from "react";
import axios from "axios";

const Signin = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { username, password } = formData;

  const usernameRef = useRef(null);
  const passwordRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(""); // Clear error on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await axios.post("http://localhost:5000/api/users/signin", {
        username,
        password,
      });

      const { user, token } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Redirect immediately without alert
      window.location.href = "/dashboard";
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
      setIsLoading(false);
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

    syncAutofill();
    const id = setTimeout(syncAutofill, 250);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="min-h-screen w-full bg-gray-200 from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col md:flex-row">
        {/* LEFT SIDE - Hero Section */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-12 lg:p-16 flex flex-col justify-center text-white relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>

          <div className="relative z-10">
            <div className="mb-8">
              <svg
                className="w-12 h-12 mb-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
              </svg>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              Welcome to
              <br />
              SKAct-Hub
            </h1>
            <p className="text-lg text-blue-100 mb-8 leading-relaxed">
              Your centralized platform for barangay management and document
              tracking. Streamline your workflow and enhance collaboration.
            </p>

            <div className="flex items-center gap-2 text-blue-100">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span className="text-sm">Powered by modern technology</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - Form Section */}
        <div className="w-full md:w-1/2 p-8 lg:p-16 flex flex-col justify-center bg-white">
          <div className="w-full max-w-md mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h2>
              <p className="text-gray-600">
                Enter your credentials to access your account
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm text-red-800">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* USERNAME */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="username"
                    ref={usernameRef}
                    value={username}
                    onInput={(e) => handleChange(e)}
                    onChange={(e) => handleChange(e)}
                    autoComplete="username"
                    required
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <input
                    type="password"
                    name="password"
                    ref={passwordRef}
                    value={password}
                    onInput={(e) => handleChange(e)}
                    onChange={(e) => handleChange(e)}
                    autoComplete="current-password"
                    required
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex items-center justify-end">
                <a
                  href="#"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Forgot password?
                </a>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <a
                  href="#"
                  className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Contact your administrator
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signin;
