import React, { useEffect, useState } from "react";
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
} from "lucide-react";

/* ===================== CONSTANTS ===================== */
const API_BASE = "http://localhost:5000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/* ===================== MAIN COMPONENT ===================== */
const ProfilePage = () => {
  /* ==================== STATE ==================== */
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

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  /* ==================== DATA FETCHING ==================== */
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_BASE}/users/me`, {
        headers: getAuthHeaders(),
      });

      if (res.data.user) {
        setFormData({
          username: res.data.user.username || "",
          password: "",
          firstname: res.data.user.firstname || "",
          lastname: res.data.user.lastname || "",
          age: res.data.user.age || "",
          role: res.data.user.role || "",
          email: res.data.user.email || "",
          address: res.data.user.address || "",
          civil: res.data.user.civil || "",
          barangay: res.data.user.barangay?.barangayName || "",
          profileImage: res.data.user.profileImage || "",
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      showMessage("Failed to load profile data", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ==================== HANDLERS ==================== */
  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 5000);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
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

      setFormData((prev) => ({
        ...prev,
        profileImage: res.data.profileImage,
      }));
      setImageFile(null);
      setImagePreview(null);
      showMessage("Profile image uploaded successfully!", "success");
    } catch (error) {
      console.error("Error uploading image:", error);
      showMessage("Failed to upload image. Try again.", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.password) delete payload.password;

      await axios.post(`${API_BASE}/users/create`, payload, {
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
      });
      showMessage("Profile updated successfully!", "success");
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      showMessage(
        error.response?.data?.message || "Failed to save profile. Try again.",
        "error",
      );
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setImageFile(null);
    setImagePreview(null);
    setMessage("");
  };

  /* ==================== LOADING STATE ==================== */
  if (loading) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-3"></div>
            <p className="text-sm text-slate-600 font-medium">
              Loading profile...
            </p>
          </div>
        </div>
      </>
    );
  }

  /* ==================== RENDER ==================== */
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-6 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Alert Message */}
          {message && (
            <div
              className={`mb-4 p-3 rounded-lg border-2 ${
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
                  className={`text-sm font-medium ${
                    messageType === "success"
                      ? "text-emerald-800"
                      : "text-red-800"
                  }`}
                >
                  {message}
                </span>
              </div>
            </div>
          )}

          {/* Main Card */}
          <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 overflow-hidden">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-bold text-white mb-1">
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
                    className="px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors shadow-md flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Profile Image Section */}
              <div className="px-6 py-5 border-b-2 border-slate-200 bg-slate-50">
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {/* Profile Picture */}
                  <div className="relative">
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-200 border-2 border-white shadow-lg">
                      {imagePreview || formData.profileImage ? (
                        <img
                          src={
                            imagePreview ||
                            `http://localhost:5000${formData.profileImage}`
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

                  {/* Upload Controls */}
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
                  /* Display Mode */
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
                  /* Edit Mode */
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
                      <InputField
                        icon={<Mail className="w-4 h-4" />}
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                      />
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
                          <option value="single">Single</option>
                          <option value="married">Married</option>
                          <option value="widowed">Widowed</option>
                          <option value="divorced">Divorced</option>
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

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t-2 border-slate-200">
                      <button
                        type="submit"
                        className="flex-1 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-md"
                      >
                        <Check className="w-4 h-4" />
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="flex-1 px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
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
}) => (
  <div>
    <label className="block text-xs font-bold text-slate-900 mb-1.5">
      {label}
    </label>
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
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
        className={`w-full ${
          icon ? "pl-9" : "pl-3"
        } pr-3 py-2 text-sm border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
          disabled
            ? "bg-slate-100 text-slate-600 cursor-not-allowed"
            : "bg-white"
        }`}
      />
    </div>
  </div>
);

export default ProfilePage;
