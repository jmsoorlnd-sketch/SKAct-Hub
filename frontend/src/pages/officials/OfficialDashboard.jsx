import React, { useState, useEffect } from "react";
import axios from "axios";
import Layout from "../../layout/Layout";
import { useToast } from "../../components/Toast";

const OfficialDashboard = () => {
  const { success, error } = useToast();
  const [showCompose, setShowCompose] = useState(false);
  const [composeMode, setComposeMode] = useState("admin"); // "admin" or "barangay"
  const [attachedFile, setAttachedFile] = useState(null);
  const [adminRecipient, setAdminRecipient] = useState("");
  const [admins, setAdmins] = useState([]);
  const [user, setUser] = useState(null);
  const [userBarangay, setUserBarangay] = useState(null);
  const [formData, setFormData] = useState({
    subject: "",
    body: "",
  });
  const [loading, setLoading] = useState(false);

  // Fetch admins and user's barangay on mount
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/messages/admins/list",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setAdmins(res.data.admins);
      } catch (err) {
        console.error("Failed to fetch admins:", err);
        error("Failed to fetch admins");
      }
    };

    const fetchUserBarangay = async () => {
      try {
        let userData = null;
        try {
          const raw = localStorage.getItem("user");
          if (raw && raw !== "undefined" && raw !== "null") {
            userData = JSON.parse(raw);
          }
        } catch (err) {
          userData = null;
        }
        setUser(userData);

        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/barangays/me/barangay",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setUserBarangay(res.data.barangay);
      } catch (err) {
        console.error("Failed to fetch user barangay:", err);
      }
    };

    fetchAdmins();
    fetchUserBarangay();
  }, [error]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendToAdmin = async (e) => {
    e.preventDefault();
    if (!adminRecipient || !formData.subject || !formData.body) {
      error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      const payload = new FormData();
      payload.append("recipientId", adminRecipient);
      payload.append("subject", formData.subject);
      payload.append("body", formData.body);
      if (formData.startDate) payload.append("startDate", formData.startDate);
      if (formData.endDate) payload.append("endDate", formData.endDate);
      if (attachedFile) payload.append("attachment", attachedFile);

      await axios.post("http://localhost:5000/api/messages/send", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      success("Message sent to admin successfully!");
      setShowCompose(false);
      setFormData({ subject: "", body: "" });
      setAttachedFile(null);
      setAdminRecipient("");
    } catch (err) {
      console.error("Send failed:", err);
      error(err.response?.data?.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  const handleSendToBarangay = async (e) => {
    e.preventDefault();
    if (!userBarangay) {
      error("You are not assigned to any barangay");
      return;
    }
    if (!formData.subject || !formData.body) {
      error("Subject and message are required");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const fd = new FormData();
      fd.append("subject", formData.subject);
      fd.append("body", formData.body);
      if (attachedFile) fd.append("attachment", attachedFile);

      await axios.post(
        `http://localhost:5000/api/barangays/${userBarangay._id}/messages`,
        fd,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      success("Message sent to barangay storage successfully!");
      setShowCompose(false);
      setFormData({ subject: "", body: "" });
      setAttachedFile(null);
    } catch (err) {
      console.error("Send to barangay failed:", err);
      error(
        err.response?.data?.message || "Failed to send message to barangay",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex w-full h-full p-6 gap-6">
        {/* LEFT SIDE */}
        <div className="w-1/4"></div>

        {/* CENTER */}
        <div className="w-2/4 bg-white rounded-xl p-6 shadow min-h-[600px]">
          {!showCompose ? (
            <>
              <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
              <p className="text-gray-600 mb-6">
                Welcome to your dashboard. Click "Compose" to send a message.
              </p>
              {userBarangay && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900">
                    Your Assigned Barangay:
                  </p>
                  <p className="text-lg font-bold text-blue-600">
                    {userBarangay.barangayName}
                  </p>
                  <p className="text-sm text-blue-700">
                    {userBarangay.city}, {userBarangay.province}
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Compose Message</h2>
                <button
                  onClick={() => {
                    setShowCompose(false);
                    setAttachedFile(null);
                    setFormData({ subject: "", body: "" });
                    setAdminRecipient("");
                    setComposeMode("admin");
                  }}
                  className="text-gray-500 hover:text-black text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Barangay Message Heading */}
              <h3 className="text-lg font-semibold mb-6 text-blue-900">
                Message to Barangay
              </h3>

              {/* Barangay Compose Form */}
              <form onSubmit={handleSendToBarangay}>
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-semibold text-green-900">
                    Sending to: {userBarangay?.barangayName}
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Enter subject"
                    className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">
                    Message Body
                  </label>
                  <textarea
                    name="body"
                    value={formData.body}
                    onChange={handleChange}
                    placeholder="Enter your message"
                    rows={6}
                    className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">
                    Document (Optional)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => {
                      if (e.target.files.length > 0) {
                        setAttachedFile(e.target.files[0]);
                      }
                    }}
                    className="w-full border rounded-lg p-2"
                  />
                  {attachedFile && (
                    <p className="text-sm text-gray-600 mt-2">
                      Selected: {attachedFile.name}
                      <button
                        type="button"
                        onClick={() => setAttachedFile(null)}
                        className="ml-2 text-red-500 hover:text-red-700 text-xs"
                      >
                        Remove
                      </button>
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-semibold transition"
                  >
                    {loading ? "Sending..." : "Send to Barangay"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ subject: "", body: "" });
                      setAttachedFile(null);
                    }}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-semibold transition"
                  >
                    Clear
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* RIGHT SIDE */}
        <div className="w-1/4 flex flex-col gap-4">
          {/* COMPOSE BUTTON */}
          <button
            onClick={() => setShowCompose(true)}
            className="flex items-center gap-3
              bg-[#D9EEFF] 
              hover:bg-[#bfe3ff]
              hover:scale-105
              hover:shadow-md
              text-black font-medium
              px-6 py-4 rounded-2xl shadow
              transition-all duration-200
              w-40 justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 3.487a2.25 2.25 0 113.182 3.182L7.5 19.313 3 21l1.688-4.5L16.862 3.487z"
              />
            </svg>
            Compose
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default OfficialDashboard;
