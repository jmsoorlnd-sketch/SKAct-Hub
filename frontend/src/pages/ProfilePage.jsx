import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../layout/Layout";

const ProfilePage = () => {
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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
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
        console.log(formData);
      } catch (err) {
        console.error("Error fetching profile:", err);
        showMessage("Failed to load profile data", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

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
      const token = localStorage.getItem("token");
      const formDataImg = new FormData();
      formDataImg.append("profileImage", imageFile);

      const res = await axios.post(
        "http://localhost:5000/api/users/upload-image",
        formDataImg,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
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
      const token = localStorage.getItem("token");
      const payload = { ...formData };
      if (!payload.password) delete payload.password;

      await axios.post("http://localhost:5000/api/users/create", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      showMessage("Profile updated successfully!", "success");
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      showMessage(
        error.response?.data?.message || "Failed to save profile. Try again.",
        "error"
      );
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setImageFile(null);
    setImagePreview(null);
    setMessage("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 ">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6"></div>

          {/* Alert Message */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg border ${
                messageType === "success"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  {messageType === "success" ? (
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  ) : (
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  )}
                </svg>
                <span className="text-sm font-medium">{message}</span>
              </div>
            </div>
          )}

          {/* Main Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 sm:px-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1">
                    My Profile
                  </h1>
                  <p className="text-blue-100 text-sm">
                    Manage your personal information
                  </p>
                </div>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-sm"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Profile Image Section */}
              <div className="px-6 py-6 sm:px-8 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Profile Picture */}
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
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
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
                          <svg
                            className="w-16 h-16 text-white"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <label className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-lg border-2 border-white">
                        <svg
                          className="w-5 h-5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
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
                  {isEditing && imageFile && (
                    <div className="flex-1">
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <svg
                              className="w-5 h-5 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                New image selected
                              </p>
                              <p className="text-xs text-gray-500">
                                {imageFile.name}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleImageUpload}
                            disabled={uploadingImage}
                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            {uploadingImage ? (
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
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                <span>Uploading...</span>
                              </>
                            ) : (
                              <>
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
                                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                  />
                                </svg>
                                <span>Upload Image</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview(null);
                            }}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {!isEditing && (
                    <div className="flex-1 text-center sm:text-left">
                      <h2 className="text-xl font-bold text-gray-900">
                        {formData.firstname} {formData.lastname}
                      </h2>
                      <p className="text-gray-600">{formData.role}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {formData.email}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Content */}
              <div className="px-6 py-6 sm:px-8">
                {!isEditing ? (
                  // Display Mode
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoField label="Username" value={formData.username} />
                    <InfoField label="Email" value={formData.email} />
                    <InfoField label="First Name" value={formData.firstname} />
                    <InfoField label="Last Name" value={formData.lastname} />
                    <InfoField label="Age" value={formData.age} />
                    <InfoField
                      label="Barangay"
                      value={formData.barangay}
                      readOnly
                    />
                    <InfoField label="Address" value={formData.address} />
                    <InfoField
                      label="Civil Status"
                      value={
                        formData.civil
                          ? formData.civil.charAt(0).toUpperCase() +
                            formData.civil.slice(1)
                          : null
                      }
                    />
                    <InfoField label="Role" value={formData.role} badge />
                  </div>
                ) : (
                  // Edit Mode
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField
                        label="Username"
                        name="username"
                        type="text"
                        value={formData.username}
                        onChange={handleChange}
                        icon={
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
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        }
                      />
                      <InputField
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        icon={
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
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                        }
                      />
                    </div>

                    <InputField
                      label="New Password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Leave blank to keep current password"
                      icon={
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
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      }
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        label="Age"
                        name="age"
                        type="number"
                        value={formData.age}
                        onChange={handleChange}
                      />
                      <InputField
                        label="Barangay"
                        name="barangayName"
                        type="text"
                        value={formData.barangay}
                        onChange={handleChange}
                        readOnly
                        icon={
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
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        }
                      />
                    </div>

                    <InputField
                      label="Address"
                      name="address"
                      type="text"
                      value={formData.address}
                      onChange={handleChange}
                      icon={
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
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                          />
                        </svg>
                      }
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Civil Status
                        </label>
                        <select
                          name="civil"
                          value={formData.civil}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          <option value="">Select status</option>
                          <option value="single">Single</option>
                          <option value="married">Married</option>
                          <option value="widowed">Widowed</option>
                          <option value="divorced">Divorced</option>
                        </select>
                      </div>

                      <InputField
                        label="Role"
                        name="role"
                        type="text"
                        value={formData.role}
                        readOnly
                        disabled
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                      <button
                        type="submit"
                        className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                      >
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
    </Layout>
  );
};

// Helper Components
const InfoField = ({ label, value, badge }) => (
  <div>
    <label className="block text-sm font-medium text-gray-500 mb-1">
      {label}
    </label>
    {badge ? (
      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
        {value || "—"}
      </span>
    ) : (
      <p className="text-base text-gray-900 font-medium">{value || "—"}</p>
    )}
  </div>
);

const InputField = ({
  label,
  name,
  type,
  value,
  onChange,
  placeholder,
  icon,
  readOnly,
  disabled,
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      {label}
    </label>
    <div className="relative">
      {icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
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
          icon ? "pl-10" : "pl-4"
        } pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
          disabled ? "bg-gray-100 text-gray-600 cursor-not-allowed" : ""
        }`}
      />
    </div>
  </div>
);

export default ProfilePage;
