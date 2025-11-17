import React, { useEffect, useState } from "react";
import axios from "axios";

const ProfilePage = () => {
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    age: "",
    address: "",
    role: "",
    email: "",
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.user) {
          setFormData({
            firstname: res.data.user.firstname || "",
            lastname: res.data.user.lastname || "",
            age: res.data.user.age || "",
            role: res.data.user.role || "",
            email: res.data.user.email || "",
            address: res.data.user.address || "",
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5000/api/users/create",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setMessage("Profile saved successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage("Failed to save profile. Try again.");
    }
  };

  if (loading) return <p>Loading profile...</p>;

  return (
    <div className="flex justify-center mt-20 px-4">
      <form
        className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-gray-200 flex flex-col gap-6"
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

        <h1 className="text-3xl font-bold text-center">Profile</h1>

        {message && (
          <p className="text-center text-green-600 font-medium">{message}</p>
        )}

        {/* Profile picture circle */}
        <div className="flex justify-center">
          <div className="w-28 h-28 bg-gray-200 rounded-full flex items-center justify-center shadow-md border border-gray-300">
            <span className="text-gray-500 text-sm">Profile</span>
          </div>
        </div>

        {/* Inputs */}
        <div className="flex flex-col gap-4">
          {[
            { label: "First Name", name: "firstname" },
            { label: "Last Name", name: "lastname" },
            { label: "Age", name: "age", type: "number" },
            { label: "Address", name: "address" },
            { label: "Role", name: "role", readOnly: true },
            { label: "Email", name: "email" },
          ].map((field, index) => (
            <div key={index} className="flex flex-col">
              <label className="font-medium mb-1">{field.label}</label>
              <input
                type={field.type || "text"}
                name={field.name}
                value={formData[field.name]}
                onChange={handleChange}
                readOnly={field.readOnly}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
              />
            </div>
          ))}
        </div>

        {/* Save Button */}
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium shadow-md transition"
        >
          Save Profile
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;
