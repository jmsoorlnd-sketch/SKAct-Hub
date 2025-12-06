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
    barangayName: "",
    profileImage: "",
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

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
            barangayName: res.data.user.barangayName || "",
            profileImage: res.data.user.profileImage || "",
          });
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
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
      setMessage("Profile image uploaded successfully!");
    } catch (error) {
      console.error("Error uploading image:", error);
      setMessage("Failed to upload image. Try again.");
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
      // Do not send empty password (only send when user wants to change)
      const payload = { ...formData };
      if (!payload.password) delete payload.password;

      await axios.post("http://localhost:5000/api/users/create", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setMessage("Profile saved successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage(
        error.response?.data?.message || "Failed to save profile. Try again."
      );
    }
  };

  if (loading) return <p>Loading profile...</p>;

  return (
    <Layout>
      <div className="flex justify-center mt-20 px-4">
        <form
          className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-lg border border-gray-200 flex flex-col gap-6"
          onSubmit={handleSubmit}
        >
          {/* Back Button */}
          <button
            type="button"
            onClick={() => (window.location.href = "/dashboard")}
            className="text-blue-600 hover:underline text-sm text-left"
          >
            ← Back to Dashboard
          </button>

          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Profile</h1>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-md transition"
              >
                Edit Profile
              </button>
            )}
          </div>

          {message && (
            <p
              className={`text-center font-medium ${
                message.includes("saved") ? "text-green-600" : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}

          {/* Profile picture circle with upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center shadow-md border border-gray-300 overflow-hidden">
              {formData.profileImage ? (
                <img
                  src={`http://localhost:5000${formData.profileImage}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-500 text-sm">No Image</span>
              )}
            </div>

            {isEditing && (
              <div className="flex flex-col items-center gap-2">
                <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  Choose Image
                </label>
                {imageFile && (
                  <>
                    <p className="text-sm text-gray-600">
                      Selected: {imageFile.name}
                    </p>
                    <button
                      type="button"
                      onClick={handleImageUpload}
                      disabled={uploadingImage}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
                    >
                      {uploadingImage ? "Uploading..." : "Upload Image"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Display Mode */}
          {!isEditing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col">
                <label className="font-semibold text-gray-600 mb-1">
                  Username
                </label>
                <p className="text-gray-900">{formData.username}</p>
              </div>

              <div className="flex flex-col">
                <label className="font-semibold text-gray-600 mb-1">
                  Email
                </label>
                <p className="text-gray-900">{formData.email}</p>
              </div>

              <div className="flex flex-col">
                <label className="font-semibold text-gray-600 mb-1">
                  First Name
                </label>
                <p className="text-gray-900">{formData.firstname || "—"}</p>
              </div>

              <div className="flex flex-col">
                <label className="font-semibold text-gray-600 mb-1">
                  Last Name
                </label>
                <p className="text-gray-900">{formData.lastname || "—"}</p>
              </div>

              <div className="flex flex-col">
                <label className="font-semibold text-gray-600 mb-1">Age</label>
                <p className="text-gray-900">{formData.age || "—"}</p>
              </div>

              <div className="flex flex-col">
                <label className="font-semibold text-gray-600 mb-1">
                  Barangay/Location
                </label>
                <p className="text-gray-900">{formData.barangayName || "—"}</p>
              </div>

              <div className="flex flex-col">
                <label className="font-semibold text-gray-600 mb-1">
                  Address
                </label>
                <p className="text-gray-900">{formData.address || "—"}</p>
              </div>

              <div className="flex flex-col">
                <label className="font-semibold text-gray-600 mb-1">
                  Civil Status
                </label>
                <p className="text-gray-900">
                  {formData.civil
                    ? formData.civil.charAt(0).toUpperCase() +
                      formData.civil.slice(1)
                    : "—"}
                </p>
              </div>

              <div className="flex flex-col">
                <label className="font-semibold text-gray-600 mb-1">Role</label>
                <p className="text-gray-900">{formData.role}</p>
              </div>
            </div>
          )}

          {/* Edit Mode */}
          {isEditing && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col">
                <label className="font-medium mb-1">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                />
              </div>

              <div className="flex flex-col">
                <label className="font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                />
              </div>

              <div className="flex flex-col">
                <label className="font-medium mb-1">
                  New Password (leave blank to keep)
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                />
              </div>

              <div className="flex flex-col">
                <label className="font-medium mb-1">First Name</label>
                <input
                  type="text"
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                />
              </div>

              <div className="flex flex-col">
                <label className="font-medium mb-1">Last Name</label>
                <input
                  type="text"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                />
              </div>

              <div className="flex flex-col">
                <label className="font-medium mb-1">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                />
              </div>

              <div className="flex flex-col">
                <label className="font-medium mb-1">Barangay/Location</label>
                <input
                  type="text"
                  name="barangayName"
                  value={formData.barangayName}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                />
              </div>

              <div className="flex flex-col">
                <label className="font-medium mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                />
              </div>

              <div className="flex flex-col">
                <label className="font-medium mb-1">Civil Status</label>
                <select
                  name="civil"
                  value={formData.civil}
                  onChange={handleChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                >
                  <option value="">Select status</option>
                  <option value="married">Married</option>
                  <option value="unmarried">Unmarried</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="font-medium mb-1">Role</label>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  readOnly
                  className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              {/* Save/Cancel Buttons */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium shadow-md transition"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setMessage("");
                  }}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2 rounded-lg font-medium shadow-md transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </Layout>
  );
};

export default ProfilePage;
