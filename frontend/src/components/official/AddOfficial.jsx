import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  X,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  Briefcase,
  ShieldCheck,
  Save,
  AlertCircle,
  CheckCircle,
  RefreshCw as RefreshIcon,
} from "lucide-react";
import { useToast } from "../Toast";

/* ===================== CONSTANTS ===================== */
const API_BASE = "http://localhost:5000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const DEFAULT_FORM = {
  firstname: "",
  lastname: "",
  email: "",
  position: "",
  username: "",
  password: "",
  confirmPassword: "",
  barangay: "",
  role: "Official",
  status: "Active",
};

// helper to generate random string
const randomString = (length = 8) => {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < length; i++) {
    s += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return s;
};

// note: generateCredentials will be defined inside component where setFormData exists

/* ===================== MAIN COMPONENT ===================== */
const CreateOfficialModal = ({ isOpen, onClose, onSubmit }) => {
  /* ==================== STATE ==================== */
  const { success, error: showError } = useToast();
  const [barangays, setBarangays] = useState([]);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fetchingBarangays, setFetchingBarangays] = useState(false);

  // helper to generate username/password and update form
  const generateCredentials = (first = "", last = "") => {
    const base = `${first}${last}`.trim().toLowerCase().replace(/\s+/g, "");
    const uname = base
      ? `${base}${Math.floor(Math.random() * 9000) + 1000}`
      : `user${randomString(5)}`;
    const pwd = randomString(10);
    setFormData((prev) => ({
      ...prev,
      username: uname,
      password: pwd,
      confirmPassword: pwd,
    }));
  };

  /* ==================== DATA FETCHING ==================== */
  useEffect(() => {
    if (isOpen) {
      fetchBarangays();
      resetForm();
    }
  }, [isOpen]);

  // whenever firstname/lastname change, regenerate username suggestion
  useEffect(() => {
    if (isOpen) {
      generateCredentials(formData.firstname, formData.lastname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.firstname, formData.lastname]);

  const fetchBarangays = async () => {
    setFetchingBarangays(true);
    try {
      const res = await axios.get(`${API_BASE}/barangays/all-barangays`, {
        headers: getAuthHeaders(),
      });
      setBarangays(res.data.barangays || []);
    } catch (error) {
      console.error("Failed to fetch barangays:", error);
    } finally {
      setFetchingBarangays(false);
    }
  };

  /* ==================== HELPERS ==================== */
  const resetForm = () => {
    setFormData(DEFAULT_FORM);
    setErrors({});
    setApiError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    generateCredentials();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  /* ==================== FORM HANDLING ==================== */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear field error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setApiError("");
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.firstname.trim())
      newErrors.firstname = "First name is required";
    if (!formData.lastname.trim()) newErrors.lastname = "Last name is required";
    // email is optional - only validate format if provided
    if (
      formData.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    )
      newErrors.email = "Enter a valid email address";
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.position) newErrors.position = "Position is required";
    if (!formData.barangay) newErrors.barangay = "Barangay is required";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    if (!formData.confirmPassword)
      newErrors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError("");

    try {
      const { confirmPassword, email: rawEmail, ...submitData } = formData;

      // Only include email if it's not empty
      if (rawEmail && rawEmail.trim()) {
        submitData.email = rawEmail.trim();
      }

      const response = await axios.post(
        `${API_BASE}/admins/create-official`,
        submitData,
        {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
        },
      );

      // show success with credentials if provided
      let msg = `SK Official "${response.data.user.firstname} ${response.data.user.lastname}" created successfully!`;
      if (response.data.credentials) {
        msg += `\nUsername: ${response.data.credentials.username}\nPassword: ${response.data.credentials.password}`;
      }
      success(msg);
      if (typeof onSubmit === "function") {
        onSubmit(response.data.user);
      }
      handleClose();
    } catch (error) {
      console.error("Error creating official:", error.response?.data || error);
      setApiError(
        error.response?.data?.message ||
          "Failed to create official. Please try again.",
      );
      showError(error.response?.data?.message || "Failed to create official");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ==================== PASSWORD STRENGTH ==================== */
  const getPasswordStrength = (password) => {
    if (!password) return null;
    if (password.length < 8)
      return { label: "Too short", color: "bg-red-500", text: "text-red-600" };
    if (password.length < 10)
      return { label: "Weak", color: "bg-amber-500", text: "text-amber-600" };
    if (password.length < 12)
      return { label: "Fair", color: "bg-yellow-500", text: "text-yellow-600" };
    return {
      label: "Strong",
      color: "bg-emerald-500",
      text: "text-emerald-600",
    };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  if (!isOpen) return null;

  /* ==================== RENDER ==================== */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 ">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        {/* ====== MODAL HEADER ====== */}
        <div className="bg-blue-600 px-6 py-5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Create SK Official</h2>
                <p className="text-blue-100 text-sm">
                  Add a new official to the system
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors disabled:opacity-50"
            >
              <X size={22} className="text-white" />
            </button>
          </div>
        </div>

        {/* ====== MODAL BODY ====== */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="p-6 overflow-y-auto flex-1 space-y-5">
            {/* API Error Banner */}
            {apiError && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm font-semibold">{apiError}</p>
              </div>
            )}

            {/* ---- Full Name Row ---- */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="First Name"
                required
                icon={<User size={15} className="text-blue-600" />}
                error={errors.firstname}
              >
                <input
                  type="text"
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleChange}
                  placeholder="Juan"
                  className={inputClass(errors.firstname)}
                />
              </FormField>

              <FormField
                label="Last Name"
                required
                icon={<User size={15} className="text-blue-600" />}
                error={errors.lastname}
              >
                <input
                  type="text"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleChange}
                  placeholder="Dela Cruz"
                  className={inputClass(errors.lastname)}
                />
              </FormField>
            </div>

            {/* ---- Position ---- */}
            <FormField
              label="Position"
              required
              icon={<Briefcase size={15} className="text-blue-600" />}
              error={errors.position}
            >
              <select
                name="position"
                value={formData.position}
                onChange={handleChange}
                className={inputClass(errors.position)}
              >
                <option value="">— Select Position —</option>
                <option value="Chairman">Chairman</option>
                <option value="Secretary">Secretary</option>
                <option value="Treasurer">Treasurer</option>
              </select>
            </FormField>

            {/* ---- Barangay ---- */}
            <FormField
              label="Barangay"
              required
              icon={<MapPin size={15} className="text-emerald-600" />}
              error={errors.barangay}
            >
              <select
                name="barangay"
                value={formData.barangay}
                onChange={handleChange}
                disabled={fetchingBarangays}
                className={inputClass(errors.barangay)}
              >
                <option value="">
                  {fetchingBarangays
                    ? "Loading barangays..."
                    : "— Select Barangay —"}
                </option>
                {barangays.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.barangayName}
                  </option>
                ))}
              </select>
            </FormField>

            {/* ---- Username ---- */}
            <FormField
              label="Username"
              required
              icon={<User size={15} className="text-blue-600" />}
              error={errors.username}
            >
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="juandelacruz"
                  autoComplete="off"
                  className={`${inputClass(errors.username)} pr-10`}
                />
                <button
                  type="button"
                  title="Regenerate"
                  onClick={() =>
                    generateCredentials(formData.firstname, formData.lastname)
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <RefreshIcon size={16} />
                </button>
              </div>
            </FormField>

            {/* ---- Email ---- */}
            <FormField
              label="Email Address"
              icon={<Mail size={15} className="text-blue-600" />}
              error={errors.email}
            >
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="juan@example.com (optional)"
                autoComplete="off"
                className={inputClass(errors.email)}
              />
            </FormField>

            {/* ---- Password ---- */}
            <FormField
              label="Password"
              required
              icon={<Lock size={15} className="text-blue-600" />}
              error={errors.password}
            >
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  className={`${inputClass(errors.password)} pr-20`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <button
                  type="button"
                  title="Regenerate"
                  onClick={() =>
                    generateCredentials(formData.firstname, formData.lastname)
                  }
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <RefreshIcon size={16} />
                </button>
              </div>
              {/* Password Strength Indicator */}
              {formData.password && passwordStrength && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500">
                      Password strength
                    </span>
                    <span
                      className={`text-xs font-bold ${passwordStrength.text}`}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{
                        width:
                          passwordStrength.label === "Too short"
                            ? "25%"
                            : passwordStrength.label === "Weak"
                              ? "50%"
                              : passwordStrength.label === "Fair"
                                ? "75%"
                                : "100%",
                      }}
                    />
                  </div>
                </div>
              )}
            </FormField>

            {/* ---- Confirm Password ---- */}
            <FormField
              label="Confirm Password"
              required
              icon={<Lock size={15} className="text-blue-600" />}
              error={errors.confirmPassword}
            >
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  className={`${inputClass(errors.confirmPassword)} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
              {/* Match indicator */}
              {formData.confirmPassword &&
                !errors.confirmPassword &&
                formData.password === formData.confirmPassword && (
                  <p className="text-emerald-600 text-xs font-semibold mt-1.5 flex items-center gap-1">
                    <CheckCircle size={12} /> Passwords match
                  </p>
                )}
            </FormField>
          </div>

          {/* ====== MODAL FOOTER ====== */}
          <div className="px-6 py-4 border-t-2 border-slate-200 bg-slate-50 flex gap-3 flex-shrink-0">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-blue-600  hover:bg-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Create Official</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-6 py-3 bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-300 rounded-xl font-bold transition-all disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ==================== HELPER COMPONENTS ==================== */

/** Reusable form field wrapper with label, icon, and error message */
const FormField = ({ label, required, icon, error, children }) => (
  <div>
    <label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
      {icon}
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && (
      <p className="flex items-center gap-1 text-red-500 text-xs font-semibold mt-1.5">
        <AlertCircle size={11} />
        {error}
      </p>
    )}
  </div>
);

/** Returns the correct Tailwind class string for an input based on its error state */
const inputClass = (hasError) =>
  `w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all bg-white ${
    hasError
      ? "border-red-400 bg-red-50 focus:ring-red-300 focus:border-red-400"
      : "border-slate-200 focus:ring-blue-300 focus:border-blue-500"
  }`;

export default CreateOfficialModal;
