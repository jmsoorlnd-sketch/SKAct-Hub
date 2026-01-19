import React, { useState, useEffect } from "react";
import axios from "axios";
import Layout from "../../layout/Layout";

const AdminDashboard = () => {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [barangays, setBarangays] = useState([]);

  // Fetch inbox messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/messages/inbox",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        // Filter to show only PENDING messages that need approval
        const pendingMessages = res.data.messages.filter(
          (msg) =>
            msg.sender?.role === "Official" &&
            !msg.isAdminScheduled &&
            msg.status === "pending",
        );
        setMessages(pendingMessages);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();

    // Fetch barangays
    const fetchBarangays = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/barangays/all-barangays",
        );
        setBarangays(res.data.barangays || []);
      } catch (error) {
        console.error("Failed to fetch barangays:", error);
        setBarangays([]);
      }
    };
    fetchBarangays();
  }, []);

  const refreshMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/messages/inbox", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const pendingMessages = res.data.messages.filter(
        (msg) =>
          msg.sender?.role === "Official" &&
          !msg.isAdminScheduled &&
          msg.status === "pending",
      );
      setMessages(pendingMessages);
    } catch (error) {
      console.error("Failed to refresh messages:", error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Delete this message?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(messages.filter((m) => m._id !== messageId));
      setSelectedMessage(null);
      alert("Message deleted");
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleApproveMessage = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/messages/admin/approve",
        {
          messageId: selectedMessage._id,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Message approved and stored to barangay!");

      // Refresh messages
      await refreshMessages();
      setSelectedMessage(null);
    } catch (error) {
      console.error("Approve failed:", error);
      const errorMsg =
        error?.response?.data?.message || "Failed to approve message";
      alert(errorMsg);
    }
  };

  const handleRejectMessage = async () => {
    if (!window.confirm("Are you sure you want to reject this message?"))
      return;

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/messages/admin/reject",
        { messageId: selectedMessage._id },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("Message rejected and will be returned to the official");

      // Refresh messages
      await refreshMessages();
      setSelectedMessage(null);
    } catch (error) {
      console.error("Reject failed:", error);
      alert("Failed to reject message");
    }
  };

  return (
    <Layout>
      <div className="w-full p-6">
        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Messages for Approval
          </h1>
          <p className="text-gray-600 mt-2">
            Review pending messages from officials and approve them to store in
            barangay storage
          </p>
        </div>

        <div className="flex w-full gap-6 bg-gray-50">
          {/* LEFT SIDE - MESSAGE LIST */}
          <div className="w-1/3 bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-4 border-b bg-linear-to-r from-blue-50 to-indigo-50">
              <h2 className="text-lg font-bold text-gray-900">
                Pending Messages ({messages.length})
              </h2>
              <p className="text-xs text-gray-600 mt-1">From Officials</p>
            </div>

            {loading ? (
              <div className="p-6 text-center text-gray-500">Loading...</div>
            ) : messages.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No pending messages
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[80vh]">
                {messages.map((msg) => (
                  <div
                    key={msg._id}
                    onClick={() => setSelectedMessage(msg)}
                    className={`p-4 border-b cursor-pointer hover:bg-blue-50 transition ${
                      selectedMessage?._id === msg._id ? "bg-blue-100" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">
                          {msg.sender?.username || "Unknown"}
                        </p>
                        <p className="text-sm text-gray-700 truncate">
                          {msg.subject}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {!msg.isRead && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-1"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT SIDE - MESSAGE DETAILS */}
          <div className="w-2/3 bg-white rounded-xl shadow-md p-6 overflow-auto max-h-[80vh]">
            {selectedMessage ? (
              <>
                {/* HEADER WITH CLOSE + DELETE BUTTONS */}
                <div className="flex justify-between items-start mb-6">
                  {/* LEFT SIDE: PROFILE PHOTO + SUBJECT + INFO */}
                  <div className="flex gap-4">
                    {/* Profile Photo */}
                    <div className="w-16 h-16 rounded-full bg-gray-200 shrink-0 overflow-hidden border border-gray-300">
                      {selectedMessage.sender?.profileImage ? (
                        <img
                          src={`http://localhost:5000${selectedMessage.sender.profileImage}`}
                          alt={selectedMessage.sender.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                          No Photo
                        </div>
                      )}
                    </div>

                    {/* Subject + Info */}
                    <div>
                      <h2 className="text-2xl font-bold">
                        {selectedMessage.subject}
                      </h2>
                      <p className="text-gray-600 text-sm mt-2">
                        From:{" "}
                        <span className="font-semibold">
                          {selectedMessage.sender?.username || "Unknown"}
                        </span>
                      </p>
                      <p className="text-gray-500 text-xs">
                        {new Date(selectedMessage.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* RIGHT SIDE: BUTTON GROUP */}
                  <div className="flex gap-3 flex-wrap">
                    {/* CLOSE BUTTON */}
                    <button
                      onClick={() => setSelectedMessage(null)}
                      className="text-gray-500 hover:text-black p-2 hover:bg-gray-200 rounded transition"
                    >
                      ✖
                    </button>

                    {/* DELETE BUTTON */}
                    <button
                      onClick={() => handleDeleteMessage(selectedMessage._id)}
                      className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L19.18 2.318a2.25 2.25 0 00-2.163-1.318h-5.034a2.25 2.25 0 00-2.163 1.318L5.310 5.807M2 9h21M4.615 8.585a2.25 2.25 0 00-1.423 2.049v6.289a2.25 2.25 0 002.25 2.25h10.716a2.25 2.25 0 002.25-2.25v-6.289a2.25 2.25 0 00-1.423-2.049m-17.306 0a2.25 2.25 0 011.423-2.049m17.306 0a2.25 2.25 0 00-1.423-2.049M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                        />
                      </svg>
                    </button>

                    {/* REJECT BUTTON */}
                    <button
                      onClick={handleRejectMessage}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                    >
                      Reject
                    </button>
                  </div>
                </div>

                {/* MESSAGE BODY */}
                <div className="border-t pt-6">
                  <p className="text-gray-800 whitespace-pre-wrap">
                    {selectedMessage.body}
                  </p>
                </div>

                {/* BARANGAY SELECTOR & APPROVE SECTION */}
                {selectedMessage.status === "pending" && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-3">
                      Approve and Store to Barangay
                    </h4>
                    <div>
                      <p className="text-sm text-gray-700 mb-3">
                        <strong>Target Barangay:</strong>{" "}
                        {barangays.find(
                          (b) => b._id === selectedMessage.attachedToBarangay,
                        )?.barangayName || "Loading..."}
                      </p>
                      <button
                        onClick={handleApproveMessage}
                        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
                      >
                        Approve & Store
                      </button>
                    </div>
                  </div>
                )}

                {/* ACTIVITY DATES & STATUS */}
                <div className="mt-4 text-sm text-gray-600">
                  {selectedMessage.startDate && (
                    <p>
                      <strong>Starts:</strong>{" "}
                      {new Date(selectedMessage.startDate).toLocaleString()}
                    </p>
                  )}
                  {selectedMessage.endDate && (
                    <p>
                      <strong>Ends:</strong>{" "}
                      {new Date(selectedMessage.endDate).toLocaleString()}
                    </p>
                  )}
                  <p className="mt-2">
                    <strong>Status:</strong>{" "}
                    <span className="uppercase font-semibold">
                      {selectedMessage.status}
                    </span>
                  </p>
                </div>

                {/* ATTACHMENT SECTION */}
                {selectedMessage.attachmentName && (
                  <div className="mt-6 p-4 bg-gray-100 rounded-lg border border-gray-300">
                    <p className="text-sm text-gray-600 mb-2">Attachment:</p>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-gray-800">
                        📎 {selectedMessage.attachmentName}
                      </p>
                      {selectedMessage.attachmentUrl && (
                        <a
                          href={`http://localhost:5000${selectedMessage.attachmentUrl}`}
                          download={selectedMessage.attachmentName}
                          className="text-blue-600 hover:underline text-sm"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Download
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>Select a message to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
