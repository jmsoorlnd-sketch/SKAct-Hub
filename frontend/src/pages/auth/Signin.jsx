import { useState, useEffect, useRef } from "react";
import axios from "axios";
import SKLOGO from "../../assets/sklogo.png";
const API_BASE = "http://localhost:5000/api";

const Signin = () => {
  /* ===================== STATE ===================== */
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // New state for failed attempts and forgot password
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");
  const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState(false);

  const usernameRef = useRef(null);
  const passwordRef = useRef(null);

  /* ===================== HANDLERS ===================== */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await axios.post(`${API_BASE}/users/signin`, {
        username: formData.username,
        password: formData.password,
      });

      // Reset failed attempts on successful login
      setFailedAttempts(0);
      setShowForgotPassword(false);

      const { user, token } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Redirect based on role
      if (user.role === "Admin") {
        window.location.href = "/admin/notifications";
      } else if (user.role === "Official") {
        window.location.href = "/official/inbox";
      } else {
        window.location.href = "/";
      }
    } catch (err) {
      // Increment failed attempts on error
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      // Show forgot password link after 3 failed attempts
      if (newAttempts >= 3) {
        setShowForgotPassword(true);
        setError(
          err.response?.data?.message ||
            "Invalid credentials. Please try again. Forgot password? Click the link below.",
        );
      } else {
        setError(
          err.response?.data?.message ||
            `Invalid credentials. You have ${3 - newAttempts} attempt(s) remaining.`,
        );
      }
      setIsLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsForgotPasswordLoading(true);
    setForgotPasswordMessage("");

    try {
      const res = await axios.post(`${API_BASE}/users/forgot-password`, {
        email: forgotPasswordEmail,
      });

      setForgotPasswordMessage(
        res.data.message || "Password reset link has been sent to your email.",
      );

      // Clear form after successful submission
      setForgotPasswordEmail("");

      // Close modal after 3 seconds
      setTimeout(() => {
        setShowForgotPasswordModal(false);
        setForgotPasswordMessage("");
      }, 3000);
    } catch (err) {
      setForgotPasswordMessage(
        err.response?.data?.message ||
          "Failed to send reset link. Please try again.",
      );
    } finally {
      setIsForgotPasswordLoading(false);
    }
  };

  // Reset failed attempts when username changes
  useEffect(() => {
    setFailedAttempts(0);
    setShowForgotPassword(false);
  }, [formData.username]);

  /* ===================== SYNC AUTOFILL ===================== */
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

  /* ===================== RENDER ===================== */
  return (
    <>
      <div className="min-h-screen w-full bg-blue-200 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
          {/* LEFT SIDE - Hero Section */}
          <div className="w-full md:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 lg:p-12 flex flex-col justify-center text-white relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-5 rounded-full -mr-24 -mt-24"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white opacity-5 rounded-full -ml-20 -mb-20"></div>

            <div className="relative z-10">
              {/* Logo */}
              <div className="mb-6">
                <img
                  src={SKLOGO}
                  alt="Logo"
                  className="h-10 w-10 object-contain"
                />
              </div>

              {/* Title */}
              <h1 className="text-3xl lg:text-4xl font-bold mb-3 leading-tight">
                Welcome to
                <br />
                SKActHub
              </h1>

              {/* Description */}
              <p className="text-base text-blue-100 mb-6 leading-relaxed">
                Your centralized platform for Sangguniang Kabataan project
                management and document tracking. Streamline your workflow and
                enhance collaboration.
              </p>

              {/* Features */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-100 text-sm">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Secure document management</span>
                </div>
                <div className="flex items-center gap-2 text-blue-100 text-sm">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Real-time project tracking</span>
                </div>
                <div className="flex items-center gap-2 text-blue-100 text-sm">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Efficient team collaboration</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - Form Section */}
          <div className="w-full md:w-1/2 p-8 lg:p-12 flex flex-col justify-center bg-blue-50">
            <div className="w-full max-w-md mx-auto">
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">
                  Sign In
                </h2>
                <p className="text-sm text-slate-600">
                  Enter your credentials to access your account
                </p>
                {failedAttempts > 0 && (
                  <p className="text-xs text-orange-600 mt-2"></p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-5 p-3 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-2">
                  <svg
                    className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-xs text-red-800 font-medium">
                    {error}
                  </span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Username Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-4 w-4 text-slate-400"
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
                      value={formData.username}
                      onInput={handleChange}
                      onChange={handleChange}
                      autoComplete="username"
                      required
                      disabled={isLoading}
                      className="w-full pl-10 pr-3 py-2.5 text-sm border-2 border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-900 placeholder-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
                      placeholder="Enter your username"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-4 w-4 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a4 4 0 002-2v-6a4 4 0 00-2-2H6a4 4 0 00-2 2v6a4 4 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <input
                      type="password"
                      name="password"
                      ref={passwordRef}
                      value={formData.password}
                      onInput={handleChange}
                      onChange={handleChange}
                      autoComplete="current-password"
                      required
                      disabled={isLoading}
                      className="w-full pl-10 pr-3 py-2.5 text-sm border-2  border-gray-500  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-900 placeholder-slate-400 disabled:bg-white disabled:cursor-not-allowed"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                {/* Forgot Password Link - Shows after 3 attempts */}
                {showForgotPassword && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setShowForgotPasswordModal(true)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-white"
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
                        className="w-4 h-4"
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
              <div className="mt-6 text-center">
                <p className="text-xs text-slate-600">
                  Don't have an account?{" "}
                  <a
                    href="#"
                    className="font-bold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Contact your administrator
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900">
                Reset Password
              </h3>
              <button
                onClick={() => {
                  setShowForgotPasswordModal(false);
                  setForgotPasswordMessage("");
                  setForgotPasswordEmail("");
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>

            {forgotPasswordMessage && (
              <div
                className={`mb-4 p-3 rounded-lg ${forgotPasswordMessage.includes("sent") ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"} text-sm`}
              >
                {forgotPasswordMessage}
              </div>
            )}

            <form onSubmit={handleForgotPassword}>
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  required
                  disabled={isForgotPasswordLoading}
                  className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-900 placeholder-slate-400 disabled:bg-slate-50"
                  placeholder="Enter your registered email"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPasswordModal(false);
                    setForgotPasswordMessage("");
                    setForgotPasswordEmail("");
                  }}
                  className="flex-1 py-2 px-4 border-2 border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isForgotPasswordLoading}
                  className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-md transition-all disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isForgotPasswordLoading ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-white"
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
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Signin;
