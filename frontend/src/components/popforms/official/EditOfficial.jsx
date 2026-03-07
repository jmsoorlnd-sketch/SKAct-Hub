import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  User,
  Mail,
  Lock,
  Shield,
  MapPin,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  Edit2,
} from "lucide-react";

/* ===================== CONSTANTS ===================== */
const API_BASE = "http://localhost:5000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/* ===================== MAIN COMPONENT ===================== */
const EditOfficial = ({ isOpen, onClose, official, onSubmit }) => {
  /* ==================== STATE ==================== */
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    firstname: "",
    lastname: "",
    position: "",
    barangay: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [barangays, setBarangays] = useState([]);

  /* ==================== EFFECTS ==================== */
  useEffect(() => {
    if (isOpen) {
      fetchBarangays();
    }
  }, [isOpen]);

  useEffect(() => {
    if (official) {
      setFormData({
        username: official.username || "",
        email: official.email || "",
        firstname: official.firstname || "",
        lastname: official.lastname || "",
        position: official.position || "",
        barangay: official.barangay?._id || official.barangay || "",
        password: "",
        confirmPassword: "",
      });
      setShowPasswordFields(false);
      setError("");
    }
  }, [official]);

  /* ==================== DATA FETCHING ==================== */
  const fetchBarangays = async () => {
    try {
      const res = await axios.get(`${API_BASE}/barangays/all-barangays`, {
        headers: getAuthHeaders(),
      });
      setBarangays(res.data.barangays || []);
    } catch (err) {
      console.error("Failed to fetch barangays:", err);
    }
  };

  /* ==================== HANDLERS ==================== */
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate passwords if reset is enabled
    if (showPasswordFields) {
      if (!formData.password || !formData.confirmPassword) {
        setError("Please fill in both password fields");
        setLoading(false);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }
    }

    // Prepare payload
    const payload = {
      username: formData.username,
      email: formData.email,
      firstname: formData.firstname,
      lastname: formData.lastname,
      position: formData.position,
      barangay: formData.barangay,
    };

    if (showPasswordFields && formData.password) {
      payload.password = formData.password;
    }

    try {
      const response = await axios.put(
        `${API_BASE}/admins/update-official/${official._id}`,
        payload,
        {
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
        },
      );
      onSubmit(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update official");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordToggle = () => {
    if (showPasswordFields) {
      setShowPasswordFields(false);
      setFormData({
        ...formData,
        password: "",
        confirmPassword: "",
      });
      setError("");
    } else {
      setShowPasswordFields(true);
    }
  };

  /* ==================== RENDER ==================== */
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Edit2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Edit Official</h2>
                <p className="text-xs text-blue-100 mt-0.5">
                  Update official information
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <span className="text-xs text-red-800 font-medium">{error}</span>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)]"
        >
          {/* Personal Information Section */}
          <div className="pb-4 border-b-2 border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 text-sm border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Enter first name"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 text-sm border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Enter last name"
                />
              </div>

              {/* Position */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-slate-600" />
                  Position *
                </label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 text-sm border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                >
                  <option value="">Select Position</option>
                  <option value="Chairman">Chairman</option>
                  <option value="Secretary">Secretary</option>
                  <option value="Treasurer">Treasurer</option>
                </select>
              </div>

              {/* Barangay */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-600" />
                  Barangay *
                </label>
                <select
                  name="barangay"
                  value={formData.barangay}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 text-sm border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                >
                  <option value="">Select Barangay</option>
                  {barangays.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.barangayName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Account Information Section */}
          <div className="pb-4 border-b-2 border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              Account Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Username */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 text-sm border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Enter username"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Enter email address (optional)"
                />
              </div>
            </div>
          </div>

          {/* Password Reset Section */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" />
              Security Settings
            </h3>

            {!showPasswordFields ? (
              <button
                type="button"
                onClick={handlePasswordToggle}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Reset Password
              </button>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800 font-semibold">
                    ⚠️ Password Reset Mode
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    Fill in both fields to update the password
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* New Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1.5">
                      New Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 pr-10 text-sm border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1.5">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 pr-10 text-sm border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePasswordToggle}
                  className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Cancel Password Reset
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t-2 border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
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
                  Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditOfficial;
