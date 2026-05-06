import React, { useEffect, useState, useContext } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import ConfirmModal from "../components/ConfirmModal";
import { createPortal } from "react-dom";
import axios from "axios";
import {
  User,
  Mail,
  Lock,
  MapPin,
  Home,
  Calendar,
  Shield,
  Camera,
  Edit2,
  Check,
  X,
  Upload,
  AlertCircle,
  AlertTriangle,
  LogOut,
  ShieldCheck,
} from "lucide-react";

const API_BASE = window.API_BASE;
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const ProfilePage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isSetupMode = searchParams.get("setup") === "true";
  const { logout } = useContext(AuthContext);

  const [isEditing, setIsEditing] = useState(isSetupMode);
  const [showSetupBanner, setShowSetupBanner] = useState(isSetupMode);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [emailError, setEmailError] = useState("");

  // ✅ Email OTP verification state
  const [originalEmail, setOriginalEmail] = useState(""); // email from DB
  const [verifiedEmail, setVerifiedEmail] = useState(""); // email that passed OTP
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    firstname: "",
    lastname: "",
    age: "",
    address: "",
    role: "",
    email: "",
    civil: "",
    barangay: "",
    profileImage: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_BASE}/users/me`, {
        headers: getAuthHeaders(),
      });
      if (res.data.user) {
        const u = res.data.user;
        const civilValue = u.civil
          ? u.civil.charAt(0).toUpperCase() + u.civil.slice(1).toLowerCase()
          : "";
        const emailVal = u.email || "";
        setFormData({
          username: u.username || "",
          password: "",
          firstname: u.firstname || "",
          lastname: u.lastname || "",
          age: u.age || "",
          role: u.role || "",
          email: emailVal,
          address: u.address || "",
          civil: civilValue,
          barangay: u.barangay?.barangayName || "",
          profileImage: u.profileImage || "",
        });
        setOriginalEmail(emailVal); // ✅ track what's in DB
        setVerifiedEmail(emailVal); // ✅ existing email counts as already verified
      }
    } catch {
      showMessage("Failed to load profile data", "error");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 5000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "email") {
      setEmailError("");
      setOtpError("");
      setOtpSuccess("");
      // ✅ Reset OTP state if email changes
      if (value !== verifiedEmail) {
        setOtpSent(false);
        setOtpValue("");
      }
    }
  };

  // ✅ Send OTP to the entered email
  const handleSendOtp = async () => {
    const email = formData.email.trim();
    if (!email) {
      setOtpError("Please enter an email address first");
      return;
    }
    setSendingOtp(true);
    setOtpError("");
    setOtpSuccess("");
    try {
      await axios.post(
        `${API_BASE}/users/send-email-otp`,
        { email },
        { headers: getAuthHeaders() },
      );
      setOtpSent(true);
      setOtpSuccess(`OTP sent to ${email}`);
    } catch (err) {
      setOtpError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  // ✅ Verify the OTP user typed
  const handleVerifyOtp = async () => {
    if (!otpValue || otpValue.length !== 6) {
      setOtpError("Please enter the 6-digit OTP");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    try {
      await axios.post(
        `${API_BASE}/users/verify-email-otp`,
        { email: formData.email.trim(), otp: otpValue },
        { headers: getAuthHeaders() },
      );
      setVerifiedEmail(formData.email.trim()); // ✅ mark as verified
      setOtpSent(false);
      setOtpValue("");
      setOtpSuccess("✓ Email verified successfully!");
    } catch (err) {
      setOtpError(err.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  // ✅ Check if email needs verification before saving
  const emailNeedsVerification =
    formData.email.trim() &&
    formData.email.trim() !== originalEmail &&
    formData.email.trim() !== verifiedEmail;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Block save if email changed but not verified
    if (emailNeedsVerification) {
      setOtpError("Please verify your email before saving");
      return;
    }

    try {
      const payload = { ...formData };
      if (!payload.password) delete payload.password;

      await axios.post(`${API_BASE}/users/create`, payload, {
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      });

      const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...savedUser,
          email: formData.email,
          hasEmail: !!(formData.email && formData.email.trim()),
        }),
      );

      showMessage("Profile updated successfully!", "success");
      setIsEditing(false);
      setShowSetupBanner(false);
      setOriginalEmail(formData.email); // ✅ update tracked email
      setVerifiedEmail(formData.email);

      if (isSetupMode) navigate("/official/inbox");
    } catch (error) {
      const backendMessage =
        error.response?.data?.message || "Failed to save profile.";
      if (backendMessage.toLowerCase().includes("email")) {
        setEmailError(backendMessage);
        return;
      }
      showMessage(backendMessage, "error");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setImageFile(null);
    setImagePreview(null);
    setMessage("");
    setOtpSent(false);
    setOtpValue("");
    setOtpError("");
    setOtpSuccess("");
    // ✅ Reset email back to DB value on cancel
    setFormData((prev) => ({ ...prev, email: originalEmail }));
    setVerifiedEmail(originalEmail);
    if (isSetupMode) navigate("/official/inbox");
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) return;
    try {
      setUploadingImage(true);
      const formDataImg = new FormData();
      formDataImg.append("profileImage", imageFile);
      const res = await axios.post(
        `${API_BASE}/users/upload-image`,
        formDataImg,
        {
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "multipart/form-data",
          },
        },
      );
      setFormData((prev) => ({ ...prev, profileImage: res.data.profileImage }));
      setImageFile(null);
      setImagePreview(null);
      showMessage("Profile image uploaded successfully!", "success");
    } catch {
      showMessage("Failed to upload image. Try again.", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleLogout = () => setShowLogoutModal(true);
  const handleConfirmLogout = async () => {
    try {
      setShowLogoutModal(false);
      await logout();
      navigate("/", { replace: true });
    } catch {
      showMessage("Failed to logout. Please try again.", "error");
    }
  };
  const handleCancelLogout = () => setShowLogoutModal(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-3" />
          <p className="text-sm text-slate-600 font-medium">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  // ✅ Computed: is the current email verified?
  const isEmailVerified =
    !formData.email.trim() ||
    formData.email.trim() === originalEmail ||
    formData.email.trim() === verifiedEmail;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-4 sm:py-6 px-3 sm:px-4">
      <div className="max-w-4xl mx-auto">
        {/* Setup Banner */}
        {showSetupBanner && (
          <div className="mb-4 p-4 rounded-lg border-2 bg-blue-50 border-blue-200 flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-900">
                Welcome! Please complete your profile.
              </p>
              <p className="text-xs text-blue-700 mt-0.5">
                Add and verify your email address before continuing. Your email
                is required to recover your account.
              </p>
            </div>
          </div>
        )}

        {/* Alert Message */}
        {message && (
          <div
            className={`mb-4 p-3 rounded-lg border-2 text-xs sm:text-sm ${
              messageType === "success"
                ? "bg-emerald-50 border-emerald-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-start gap-2">
              {messageType === "success" ? (
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              )}
              <span
                className={`font-medium ${messageType === "success" ? "text-emerald-800" : "text-red-800"}`}
              >
                {message}
              </span>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-md border-2 border-slate-200 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white mb-1">
                  My Profile
                </h1>
                <p className="text-xs text-blue-100">
                  Manage your personal information
                </p>
              </div>
              {!isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-3 sm:px-4 py-2 bg-white text-blue-600 rounded-lg text-xs sm:text-sm font-bold hover:bg-blue-50 transition-colors shadow-md flex items-center gap-2 whitespace-nowrap"
                >
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Profile Image Section */}
            <div className="px-6 py-5 border-b-2 border-slate-200 bg-slate-50">
              <div className="flex flex-col sm:flex-row items-center gap-5">
                <div className="relative">
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-200 border-2 border-white shadow-lg">
                    {imagePreview || formData.profileImage ? (
                      <img
                        src={
                          imagePreview ||
                          `${window.BACKEND_URL}${formData.profileImage}`
                        }
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
                        <User className="w-12 h-12 text-white" />
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-md border-2 border-white">
                      <Camera className="w-4 h-4 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {isEditing && imageFile ? (
                  <div className="flex-1 w-full">
                    <div className="bg-white border border-slate-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Camera className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900">
                            New image selected
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {imageFile.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleImageUpload}
                          disabled={uploadingImage}
                          className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                        >
                          {uploadingImage ? (
                            <>
                              <svg
                                className="animate-spin h-3 w-3"
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
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-3 h-3" />
                              <span>Upload</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : !isEditing ? (
                  <div className="flex-1 text-center sm:text-left">
                    <h2 className="text-lg font-bold text-slate-900">
                      {formData.firstname} {formData.lastname}
                    </h2>
                    <p className="text-sm text-slate-600">{formData.role}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formData.email}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Form Content */}
            <div className="px-6 py-5">
              {!isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoField
                    icon={<User className="w-4 h-4" />}
                    label="Username"
                    value={formData.username}
                  />
                  <InfoField
                    icon={<Mail className="w-4 h-4" />}
                    label="Email"
                    value={formData.email}
                  />
                  <InfoField label="First Name" value={formData.firstname} />
                  <InfoField label="Last Name" value={formData.lastname} />
                  <InfoField
                    icon={<Calendar className="w-4 h-4" />}
                    label="Age"
                    value={formData.age}
                  />
                  <InfoField
                    icon={<MapPin className="w-4 h-4" />}
                    label="Barangay"
                    value={formData.barangay}
                  />
                  <InfoField
                    icon={<Home className="w-4 h-4" />}
                    label="Address"
                    value={formData.address}
                  />
                  <InfoField
                    label="Civil Status"
                    value={
                      formData.civil
                        ? formData.civil.charAt(0).toUpperCase() +
                          formData.civil.slice(1)
                        : null
                    }
                  />
                  <InfoField
                    icon={<Shield className="w-4 h-4" />}
                    label="Role"
                    value={formData.role}
                    badge
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      icon={<User className="w-4 h-4" />}
                      label="Username"
                      name="username"
                      type="text"
                      value={formData.username}
                      onChange={handleChange}
                    />

                    {/* ✅ Email field with OTP verification */}
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1.5">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <div
                            className={`absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none ${emailError ? "text-red-400" : "text-slate-400"}`}
                          >
                            <Mail className="w-4 h-4" />
                          </div>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="juan@gmail.com"
                            className={`w-full pl-9 pr-3 py-2 text-sm border-2 rounded-lg transition-all ${
                              emailError
                                ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500"
                                : isEmailVerified && formData.email
                                  ? "border-emerald-400 bg-emerald-50 focus:ring-2 focus:ring-emerald-400"
                                  : "border-slate-200 bg-white focus:ring-2 focus:ring-blue-500"
                            }`}
                          />
                        </div>

                        {/* ✅ Verify button — only show if email changed */}
                        {!isEmailVerified && (
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={sendingOtp}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white text-xs font-bold rounded-lg whitespace-nowrap flex items-center gap-1 transition-colors"
                          >
                            {sendingOtp ? (
                              <>
                                <svg
                                  className="animate-spin h-3 w-3"
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
                              "Verify Email"
                            )}
                          </button>
                        )}

                        {/* ✅ Verified badge */}
                        {isEmailVerified && formData.email && (
                          <div className="flex items-center gap-1 px-3 py-2 bg-emerald-50 border-2 border-emerald-400 rounded-lg">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-bold text-emerald-700">
                              Verified
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Email errors / success */}
                      {emailError && (
                        <p className="mt-1 text-xs font-medium text-red-600">
                          {emailError}
                        </p>
                      )}
                      {otpSuccess && !otpSent && (
                        <p className="mt-1 text-xs font-medium text-emerald-600">
                          {otpSuccess}
                        </p>
                      )}
                      {otpError && !otpSent && (
                        <p className="mt-1 text-xs font-medium text-red-600">
                          {otpError}
                        </p>
                      )}

                      {/* ✅ OTP input — shown after Send OTP is clicked */}
                      {otpSent && (
                        <div className="mt-2 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
                          <p className="text-xs text-blue-700 font-medium mb-2">
                            OTP sent to <strong>{formData.email}</strong>.
                            Expires in 10 minutes.
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={otpValue}
                              onChange={(e) => {
                                setOtpValue(
                                  e.target.value.replace(/\D/g, "").slice(0, 6),
                                );
                                setOtpError("");
                              }}
                              placeholder="000000"
                              maxLength={6}
                              className="flex-1 px-3 py-2 text-sm border-2 border-slate-200 rounded-lg text-center font-bold tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                              type="button"
                              onClick={handleVerifyOtp}
                              disabled={otpLoading || otpValue.length !== 6}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                            >
                              {otpLoading ? (
                                <>
                                  <svg
                                    className="animate-spin h-3 w-3"
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
                                <>
                                  <Check className="w-3 h-3" />
                                  Confirm
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setOtpSent(false);
                                setOtpValue("");
                                setOtpError("");
                              }}
                              className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                          {otpError && (
                            <p className="mt-1.5 text-xs font-medium text-red-600">
                              {otpError}
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={sendingOtp}
                            className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium underline"
                          >
                            Resend OTP
                          </button>
                        </div>
                      )}

                      <p className="text-xs text-slate-400 mt-1">
                        Accepted: Gmail, Yahoo, Outlook, Hotmail, iCloud,
                        ProtonMail
                      </p>
                    </div>
                  </div>

                  <InputField
                    icon={<Lock className="w-4 h-4" />}
                    label="New Password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Leave blank to keep current password"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      label="First Name"
                      name="firstname"
                      type="text"
                      value={formData.firstname}
                      onChange={handleChange}
                    />
                    <InputField
                      label="Last Name"
                      name="lastname"
                      type="text"
                      value={formData.lastname}
                      onChange={handleChange}
                    />
                    <InputField
                      icon={<Calendar className="w-4 h-4" />}
                      label="Age"
                      name="age"
                      type="number"
                      value={formData.age}
                      onChange={handleChange}
                    />
                    <InputField
                      icon={<MapPin className="w-4 h-4" />}
                      label="Barangay"
                      name="barangayName"
                      type="text"
                      value={formData.barangay}
                      onChange={handleChange}
                      readOnly
                    />
                  </div>

                  <InputField
                    icon={<Home className="w-4 h-4" />}
                    label="Address"
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleChange}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-900 mb-1.5">
                        Civil Status
                      </label>
                      <select
                        name="civil"
                        value={formData.civil}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      >
                        <option value="">Select status</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Widowed">Widowed</option>
                        <option value="Divorced">Divorced</option>
                      </select>
                    </div>
                    <InputField
                      icon={<Shield className="w-4 h-4" />}
                      label="Role"
                      name="role"
                      type="text"
                      value={formData.role}
                      readOnly
                      disabled
                    />
                  </div>

                  {/* ✅ Warning if email not verified */}
                  {emailNeedsVerification && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border-2 border-amber-200 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs font-medium text-amber-800">
                        Please verify your new email address before saving.
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div
                    className={`flex gap-2 pt-4 border-t-2 border-slate-200 ${isSetupMode ? "justify-center" : "flex-col sm:flex-row"}`}
                  >
                    <button
                      type="submit"
                      disabled={emailNeedsVerification}
                      className={`flex-1 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-md ${
                        emailNeedsVerification
                          ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      {isSetupMode ? "Complete Setup" : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={isSetupMode ? handleLogout : handleCancel}
                      className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                        isSetupMode
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                      }`}
                    >
                      <X className="w-4 h-4" />
                      {isSetupMode ? "Logout" : "Cancel"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      {showLogoutModal &&
        createPortal(
          <ConfirmModal
            isOpen={showLogoutModal}
            title="Confirm Logout"
            message="Are you sure you want to logout?"
            icon={AlertTriangle}
            iconBgClass="bg-red-600"
            iconColorClass="text-white"
            confirmText="Logout"
            confirmIcon={LogOut}
            confirmClass="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
            onConfirm={handleConfirmLogout}
            onCancel={handleCancelLogout}
          />,
          document.body,
        )}
    </div>
  );
};

/* ==================== HELPER COMPONENTS ==================== */
const InfoField = ({ icon, label, value, badge }) => (
  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
    <div className="flex items-center gap-2 mb-1">
      {icon && <div className="text-slate-500">{icon}</div>}
      <label className="text-xs font-bold text-slate-600">{label}</label>
    </div>
    {badge ? (
      <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-bold">
        {value || "—"}
      </span>
    ) : (
      <p className="text-sm text-slate-900 font-semibold">{value || "—"}</p>
    )}
  </div>
);

const InputField = ({
  icon,
  label,
  name,
  type,
  value,
  onChange,
  placeholder,
  readOnly,
  disabled,
  required,
  error,
}) => (
  <div>
    <label className="block text-xs font-bold text-slate-900 mb-1.5">
      {label}
    </label>
    <div className="relative">
      {icon && (
        <div
          className={`absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none ${error ? "text-red-400" : "text-slate-400"}`}
        >
          {icon}
        </div>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        disabled={disabled}
        required={required}
        className={`w-full ${icon ? "pl-9" : "pl-3"} pr-3 py-2 text-sm border-2 rounded-lg transition-all
          ${error ? "border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500" : "border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"}
          ${disabled ? "bg-slate-100 text-slate-600 cursor-not-allowed" : "bg-white"}`}
      />
    </div>
    {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
  </div>
);

export default ProfilePage;
