import React, { useState, useEffect } from "react";
import axios from "axios";
import Layout from "../../layout/Layout";

const Dashboard = () => {
  const [openCompose, setOpenCompose] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [adminRecipient, setAdminRecipient] = useState("");
  const [admins, setAdmins] = useState([]);
  const [formData, setFormData] = useState({
    subject: "",
    body: "",
  });
  const [loading, setLoading] = useState(false);

  // Fetch admins on mount
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/messages/admins/list",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setAdmins(res.data.admins);
      } catch (error) {
        console.error("Failed to fetch admins:", error);
      }
    };
    fetchAdmins();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendMessage = async () => {
    if (!adminRecipient || !formData.subject || !formData.body) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const data = {
        recipientId: adminRecipient,
        subject: formData.subject,
        body: formData.body,
        attachmentName: attachedFile?.name || null,
      };

      const _res = await axios.post(
        "http://localhost:5000/api/messages/send",
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Message sent successfully!");
      setOpenCompose(false);
      setFormData({ subject: "", body: "" });
      setAttachedFile(null);
      setAdminRecipient("");
    } catch (error) {
      console.error("Send failed:", error);
      alert(error.response?.data?.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex w-full h-full p-6 gap-6">
        {/* LEFT SIDE */}
        <div className="w-1/4"></div>

        {/* CENTER CONTENT */}
        <div className="w-2/4 bg-white rounded-xl p-6 shadow min-h-[600px]">
          <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
          <p>Your main content will appear here.</p>
        </div>

        {/* RIGHT SIDE */}
        <div className="w-1/4 flex flex-col gap-4">
          {/* COMPOSE BUTTON */}
          <button
            onClick={() => setOpenCompose(true)}
            className="flex items-center gap-3
            bg-[#D9EEFF] hover:bg-[#c9e7ff]
            text-black font-medium
            px-6 py-4 rounded-2xl shadow-sm
            transition w-40 justify-center"
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

          {/* INBOX */}
          <div
            className="flex items-center bg-blue-100 px-4 py-3 
            rounded-xl cursor-pointer hover:bg-blue-200 transition shadow"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 mr-2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75M21.75 6.75A2.25 2.25 0 0019.5 4.5H4.5A2.25 2.25 0 002.25 6.75M21.75 6.75v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.583a2.25 2.25 0 01-2.31 0L3.37 8.909a2.25 2.25 0 01-1.12-1.916V6.75"
              />
            </svg>
            <span className="font-medium">Inbox</span>
          </div>
        </div>
      </div>

      {/* ==============================
              COMPOSE POPUP WINDOW
      =============================== */}
      {openCompose && (
        <div className="fixed bottom-4 right-6 w-[450px] bg-white shadow-xl rounded-lg border">
          {/* HEADER */}
          <div className="flex justify-between items-center px-4 py-2 bg-gray-100 rounded-t-lg border-b">
            <span className="font-medium">New Message</span>
            <button
              onClick={() => {
                setOpenCompose(false);
                setAttachedFile(null);
                setFormData({ subject: "", body: "" });
                setAdminRecipient("");
              }}
              className="text-gray-500 hover:text-black"
            >
              ✕
            </button>
          </div>

          {/* BODY */}
          <div className="flex flex-col px-4 py-3">
            {/* Recipient Dropdown */}
            <select
              value={adminRecipient}
              onChange={(e) => setAdminRecipient(e.target.value)}
              className="border-b py-2 text-sm outline-none mb-2"
            >
              <option value="">Select Admin Recipient</option>
              {admins.map((admin) => (
                <option key={admin._id} value={admin._id}>
                  {admin.username} ({admin.email})
                </option>
              ))}
            </select>

            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Subject"
              className="border-b py-2 text-sm outline-none"
            />

            <textarea
              name="body"
              value={formData.body}
              onChange={handleChange}
              placeholder="Message..."
              className="mt-3 h-40 resize-none outline-none text-sm"
            />

            {/* SHOW ATTACHED FILE NAME */}
            {attachedFile && (
              <div className="mt-2 text-sm bg-gray-100 p-2 rounded border flex justify-between items-center">
                <span>{attachedFile.name}</span>
                <button
                  className="text-red-500 text-xs"
                  onClick={() => setAttachedFile(null)}
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="flex items-center gap-3 px-4 py-3">
            {/* SEND BUTTON */}
            <button
              onClick={handleSendMessage}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send"}
            </button>

            {/* ATTACH FILE BUTTON */}
            <label className="cursor-pointer">
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files.length > 0) {
                    setAttachedFile(e.target.files[0]);
                  }
                }}
              />

              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-gray-600 hover:text-black transition"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18.364 5.636l-7.778 7.778a3 3 0 11-4.243-4.243l7.778-7.778a4.5 4.5 0 016.364 6.364l-7.778 7.778a6 6 0 01-8.486-8.486l7.778-7.778"
                />
              </svg>
            </label>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;
