import { useState, useEffect, useRef } from "react";
import axios from "axios";
import SKLOGO from "../../assets/sklogo.png";
import { API_BASE } from "../../config/apiConfig.js";

const Signin = () => {
  /* ===================== STATE ===================== */
  const [formData, setFormData] = useState({
    username: "", // This can now be either username or email
    password: "",
  });
  const [loginType, setLoginType] = useState("username"); // Track login method
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // New state for failed attempts and forgot password
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showForgotPassword, setShowForgotPassword] = useState(true); // always show link for accessibility
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");
  const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState(false);

  // Add this state at the top of Signin component
  const [resetStep, setResetStep] = useState(1); // 1=email, 2=otp, 3=newpassword
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const usernameRef = useRef(null);
  const passwordRef = useRef(null);

  /* ===================== HANDLERS ===================== */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");

    // Auto-detect login type based on input (if it contains @ it's email)
    if (name === "username") {
      if (value.includes("@")) {
        setLoginType("email");
      } else {
        setLoginType("username");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Prepare request body based on login type
      const requestBody =
        loginType === "email"
          ? { email: formData.username, password: formData.password }
          : { username: formData.username, password: formData.password };

      const res = await axios.post(`${API_BASE}/users/signin`, requestBody);

      // Reset failed attempts on successful login
      setFailedAttempts(0);
      setShowForgotPassword(true); // keep forgot password visible for quick recovery

      const { user, token } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Redirect based on role
      if (user.role === "Admin") {
        window.location.href = "/admin/notifications";
      } else if (user.role === "Official") {
        if (!user.hasEmail) {
          window.location.href = "/profile-create?setup=true"; // ✅ no email → profile setup
        } else {
          window.location.href = "/official/inbox"; // ✅ has email → inbox
        }
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
  const handleSubmitEmail = async (e) => {
    e.preventDefault();
    setIsForgotPasswordLoading(true);
    setForgotPasswordMessage("");
    try {
      await axios.post(`${API_BASE}/users/forgot-password`, {
        email: forgotPasswordEmail,
      });
      setResetEmail(forgotPasswordEmail);
      setResetStep(2); // move to OTP step
      setForgotPasswordMessage("");
    } catch (err) {
      setForgotPasswordMessage(
        err.response?.data?.message || "Failed to send OTP. Try again.",
      );
    } finally {
      setIsForgotPasswordLoading(false);
    }
  };

  // Step 2 — verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsForgotPasswordLoading(true);
    setForgotPasswordMessage("");
    try {
      const res = await axios.post(`${API_BASE}/users/verify-otp`, {
        email: resetEmail,
        otp: resetOtp,
      });
      setResetToken(res.data.resetToken);
      setResetStep(3); // move to new password step
    } catch (err) {
      setForgotPasswordMessage(
        err.response?.data?.message || "Invalid or expired OTP.",
      );
    } finally {
      setIsForgotPasswordLoading(false);
    }
  };

  // Step 3 — reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setForgotPasswordMessage("Passwords do not match");
      return;
    }
    setIsForgotPasswordLoading(true);
    setForgotPasswordMessage("");
    try {
      await axios.post(`${API_BASE}/users/reset-password`, {
        resetToken,
        password: newPassword,
        confirmPassword: confirmNewPassword,
      });
      // Success — close modal and reset everything
      setShowForgotPasswordModal(false);
      setResetStep(1);
      setForgotPasswordEmail("");
      setResetOtp("");
      setResetToken("");
      setNewPassword("");
      setConfirmNewPassword("");
      setForgotPasswordMessage("");
      setError("Password reset successful! Please sign in.");
    } catch (err) {
      setForgotPasswordMessage(
        err.response?.data?.message || "Failed to reset password.",
      );
    } finally {
      setIsForgotPasswordLoading(false);
    }
  };

  // Reset failed attempts when username/email changes
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

      // Auto-detect login type
      if (u.includes("@")) {
        setLoginType("email");
      } else {
        setLoginType("username");
      }
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
          {/* MOBILE HEADER - Logo and Title */}
          <div className="md:hidden w-full bg-gradient-to-br from-blue-600 to-indigo-700 p-3 flex flex-col justify-center text-white relative overflow-hidden">
            <div className="relative z-10">
              {/* Logo */}
              <div className="mb-2">
                <img
                  src={SKLOGO}
                  alt="Logo"
                  className="h-6 w-6 object-contain"
                />
              </div>

              {/* Title */}
              <h1 className="text-lg font-bold mb-0 leading-tight">
                Welcome to
                <br />
                SKActHub
              </h1>
            </div>
          </div>

          {/* LEFT SIDE - Hero Section */}
          <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 md:p-8 lg:p-12 flex-col justify-center text-white relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-5 rounded-full -mr-24 -mt-24"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-white opacity-5 rounded-full -ml-20 -mb-20"></div>

            <div className="relative z-10">
              {/* Logo */}
              <div className="mb-4 md:mb-6">
                <img
                  src={SKLOGO}
                  alt="Logo"
                  className="h-8 md:h-10 w-8 md:w-10 object-contain"
                />
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 leading-tight">
                Welcome to
                <br />
                SKActHub
              </h1>

              {/* Description */}
              <p className="text-sm md:text-base text-blue-100 mb-6 leading-relaxed">
                Your centralized platform for Sangguniang Kabataan project
                management and document tracking. Streamline your workflow and
                enhance collaboration.
              </p>

              {/* Features */}
              <div className="space-y-1.5 md:space-y-2">
                <div className="flex items-center gap-2 text-blue-100 text-xs md:text-sm">
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
          <div className="w-full md:w-1/2 p-4 md:p-8 lg:p-12 flex flex-col justify-center bg-blue-50 overflow-y-auto max-h-screen md:max-h-none">
            <div className="w-full max-w-md mx-auto">
              {/* Header */}
              <div className="mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-1">
                  Sign In
                </h2>
                <p className="text-xs md:text-sm text-slate-600">
                  Enter your username or email to access your account
                </p>
                {failedAttempts > 0 && (
                  <p className="text-xs text-orange-600 mt-2"></p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-3 md:mb-5 p-2 md:p-3 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-2">
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

              {/* Login Type Indicator */}
              {formData.username && (
                <div className="mb-3 text-right">
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    Logging in with:{" "}
                    {loginType === "email" ? "Email" : "Username"}
                  </span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3 md:space-y-5">
                {/* Username/Email Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Username or Email
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
                      className="w-full pl-10 pr-3 py-2 md:py-2.5 text-xs md:text-sm border-2 border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-900 placeholder-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed"
                      placeholder="Enter your username or email"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 md:mt-1">
                    Use your username or registered email address
                  </p>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
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
                      className="w-full pl-10 pr-3 py-2 md:py-2.5 text-xs md:text-sm border-2  border-gray-500  rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-slate-900 placeholder-slate-400 disabled:bg-white disabled:cursor-not-allowed"
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
                  className="w-full py-2 md:py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs md:text-sm font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed"
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
              <div className="mt-4 md:mt-6 text-center">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Reset Password
                </h3>
                {/* Step indicator */}
                <div className="flex items-center gap-2 mt-2">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center gap-1">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          resetStep === s
                            ? "bg-blue-600 text-white"
                            : resetStep > s
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {resetStep > s ? "✓" : s}
                      </div>
                      {s < 3 && (
                        <div
                          className={`w-8 h-0.5 ${resetStep > s ? "bg-emerald-400" : "bg-slate-200"}`}
                        />
                      )}
                    </div>
                  ))}
                  <span className="text-xs text-slate-500 ml-1">
                    {resetStep === 1
                      ? "Enter Email"
                      : resetStep === 2
                        ? "Verify OTP"
                        : "New Password"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowForgotPasswordModal(false);
                  setResetStep(1);
                  setForgotPasswordMessage("");
                  setForgotPasswordEmail("");
                  setResetOtp("");
                  setNewPassword("");
                  setConfirmNewPassword("");
                }}
                className="text-slate-400 hover:text-slate-600"
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

            {/* Error/Success Message */}
            {forgotPasswordMessage && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm ${
                  forgotPasswordMessage.includes("sent") ||
                  forgotPasswordMessage.includes("verified")
                    ? "bg-green-50 border border-green-200 text-green-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}
              >
                {forgotPasswordMessage}
              </div>
            )}

            {/* ── STEP 1: Email ── */}
            {resetStep === 1 && (
              <form onSubmit={handleSubmitEmail} className="mt-4">
                <p className="text-sm text-slate-600 mb-4">
                  Enter your registered email. We'll send you a 6-digit OTP.
                </p>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  required
                  disabled={isForgotPasswordLoading}
                  placeholder="juan@gmail.com"
                  className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-1"
                />
                <p className="text-xs text-slate-400 mb-4"></p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(false)}
                    className="flex-1 py-2 px-4 border-2 border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isForgotPasswordLoading}
                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg disabled:bg-slate-400 flex items-center justify-center gap-2"
                  >
                    {isForgotPasswordLoading ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
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
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Sending...
                      </>
                    ) : (
                      "Send OTP"
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ── STEP 2: OTP ── */}
            {resetStep === 2 && (
              <form onSubmit={handleVerifyOtp} className="mt-4">
                <p className="text-sm text-slate-600 mb-1">
                  Enter the 6-digit OTP sent to:
                </p>
                <p className="text-sm font-bold text-blue-600 mb-4">
                  {resetEmail}
                </p>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  OTP Code
                </label>
                <input
                  type="text"
                  value={resetOtp}
                  onChange={(e) =>
                    setResetOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  required
                  maxLength={6}
                  disabled={isForgotPasswordLoading}
                  placeholder="000000"
                  className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-1 text-center text-xl font-bold tracking-widest"
                />
                <p className="text-xs text-slate-400 mb-4">
                  OTP expires in 10 minutes
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setResetStep(1);
                      setForgotPasswordMessage("");
                    }}
                    className="flex-1 py-2 px-4 border-2 border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isForgotPasswordLoading || resetOtp.length !== 6}
                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg disabled:bg-slate-400 flex items-center justify-center gap-2"
                  >
                    {isForgotPasswordLoading ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
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
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Verifying...
                      </>
                    ) : (
                      "Verify OTP"
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ── STEP 3: New Password ── */}
            {resetStep === 3 && (
              <form onSubmit={handleResetPassword} className="mt-4">
                <p className="text-sm text-slate-600 mb-4">
                  Enter your new password below.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1.5">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      disabled={isForgotPasswordLoading}
                      placeholder="Min. 8 characters"
                      className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1.5">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      required
                      disabled={isForgotPasswordLoading}
                      placeholder="Re-enter new password"
                      className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        confirmNewPassword && newPassword !== confirmNewPassword
                          ? "border-red-400 bg-red-50"
                          : "border-slate-200"
                      }`}
                    />
                    {confirmNewPassword &&
                      newPassword === confirmNewPassword && (
                        <p className="text-xs text-emerald-600 font-semibold mt-1">
                          ✓ Passwords match
                        </p>
                      )}
                    {confirmNewPassword &&
                      newPassword !== confirmNewPassword && (
                        <p className="text-xs text-red-500 font-semibold mt-1">
                          ✗ Passwords do not match
                        </p>
                      )}
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setResetStep(2);
                      setForgotPasswordMessage("");
                    }}
                    className="flex-1 py-2 px-4 border-2 border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isForgotPasswordLoading ||
                      newPassword !== confirmNewPassword ||
                      newPassword.length < 8
                    }
                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg disabled:bg-slate-400 flex items-center justify-center gap-2"
                  >
                    {isForgotPasswordLoading ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
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
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Resetting...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}{" "}
    </>
  );
};

export default Signin;
