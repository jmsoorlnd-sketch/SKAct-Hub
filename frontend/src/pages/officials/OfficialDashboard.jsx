import React, { useState, useEffect } from "react";
import axios from "axios";
import Layout from "../../layout/Layout";
import { useToast } from "../../components/Toast";

const OfficialDashboard = () => {
  const { success, error } = useToast();
  const token = localStorage.getItem("token");

  const [showCompose, setShowCompose] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [userBarangay, setUserBarangay] = useState(null);
  const [formData, setFormData] = useState({
    subject: "",
    body: "",
  });

  /* FETCH BARANGAY */
  useEffect(() => {
    const fetchUserBarangay = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/barangays/me/barangay",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setUserBarangay(res.data.barangay);
      } catch {
        error("Failed to fetch barangay");
      }
    };

    fetchUserBarangay();
  }, []);

  /* HELPERS  */
  const resetForm = () => {
    setFormData({ subject: "", body: "" });
    setAttachedFile(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setAttachedFile(e.target.files?.[0] || null);
  };

  /* SUBMIT */
  const handleSendToBarangay = async (e) => {
    e.preventDefault();

    if (!userBarangay) return error("No barangay assigned");
    if (!formData.subject || !formData.body)
      return error("Subject and message are required");

    setLoading(true);

    try {
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

      success("Message sent successfully");
      resetForm();
      setShowCompose(false);
    } catch (err) {
      error(err.response?.data?.message || "Send failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {/* DASHBOARD */}
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <p className="text-gray-600 mb-6">Click compose to send a message.</p>

        {userBarangay && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg w-96">
            <p className="text-sm font-semibold text-blue-900">
              Assigned Barangay
            </p>
            <p className="text-lg font-bold text-blue-600">
              {userBarangay.barangayName}
            </p>
            <p className="text-sm text-blue-700">
              {userBarangay.city}, {userBarangay.province}
            </p>
          </div>
        )}
      </div>

      {/* FLOATING COMPOSE BUTTON */}
      <button
        onClick={() => setShowCompose(true)}
        className="fixed bottom-6 right-6
          bg-blue-300 hover:bg-[#bfe3ff]
          px-6 py-3 rounded-full shadow-lg
          font-medium transition"
      >
        Compose
      </button>

      {/* COMPOSE POPUP  */}
      {showCompose && (
        <div className="fixed bottom-20 right-6 w-[420px] bg-white rounded-xl shadow-2xl border border-gray-300 z-50">
          {/* HEADER */}
          <div className="flex justify-between items-center px-4 py-3 bg-gray-100 rounded-t-xl">
            <h3 className="font-semibold text-sm">New Message</h3>
            <button
              onClick={() => {
                setShowCompose(false);
                resetForm();
              }}
              className="text-gray-500 hover:text-black"
            >
              ✕
            </button>
          </div>

          {/* BODY */}
          <form onSubmit={handleSendToBarangay} className="p-4">
            <p className="text-sm mb-2 text-gray-600">
              To:{" "}
              <span className="font-semibold">
                {userBarangay?.barangayName}
              </span>
            </p>

            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Subject"
              className="w-full border-b p-2 mb-3 outline-none"
            />

            <textarea
              name="body"
              rows={5}
              value={formData.body}
              onChange={handleChange}
              placeholder="Message"
              className="w-full resize-none outline-none p-2 border rounded mb-3"
            />

            {/* Hidden file input */}
            <input
              type="file"
              id="fileUpload"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Clickable upload button */}
            <label
              htmlFor="fileUpload"
              className="inline-flex items-center gap-2 cursor-pointer
    text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              📎 Attach file
            </label>

            {attachedFile && (
              <p className="text-xs text-gray-600 mt-1">
                {attachedFile.name}
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="ml-2 text-red-500"
                >
                  Remove
                </button>
              </p>
            )}

            {/* FOOTER */}
            <div className="flex justify-between items-center mt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-5 py-2 rounded-full"
              >
                {loading ? "Sending..." : "Send"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="text-sm text-gray-500"
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
};

export default OfficialDashboard;
