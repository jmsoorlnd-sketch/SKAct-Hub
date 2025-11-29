import React, { useState, useEffect } from "react";
import axios from "axios";
import Layout from "../layout/Layout";

const Dashboard = () => {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch inbox messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/messages/inbox",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setMessages(res.data.messages || []);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  // Delete message
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Delete this message?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessages((prev) => prev.filter((m) => m._id !== messageId));
      setSelectedMessage(null);
      alert("Message deleted");
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleUpdateStatus = async (messageId, status) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/api/messages/${messageId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh messages
      const res = await axios.get("http://localhost:5000/api/messages/inbox", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data.messages);

      const updated = res.data.messages.find((m) => m._id === messageId);
      setSelectedMessage(updated || null);
    } catch (error) {
      console.error("Update status failed:", error);
    }
  };

  return (
    <Layout>
      <div className="flex w-full min-h-screen p-6 gap-6 bg-gray-50">
        {/* LEFT SIDE - MESSAGE LIST */}
        <div className="w-1/3 bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">Inbox ({messages.length})</h2>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : messages.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No messages yet</div>
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
                        {msg.sender?.username || "Unknown Sender"}
                      </p>
                      <p className="text-sm text-gray-700 truncate">
                        {msg.subject || "(No Subject)"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {msg.createdAt
                          ? new Date(msg.createdAt).toLocaleDateString()
                          : ""}
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
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedMessage.subject || "(No Subject)"}
                  </h2>
                  <p className="text-gray-600 text-sm mt-2">
                    From:{" "}
                    <span className="font-semibold">
                      {selectedMessage.sender?.username || "Unknown Sender"}
                    </span>
                  </p>
                  <p className="text-gray-500 text-xs">
                    {selectedMessage.createdAt
                      ? new Date(selectedMessage.createdAt).toLocaleString()
                      : ""}
                  </p>
                </div>

                {/* BUTTONS */}
                <div className="flex gap-3">
                  {/* CLOSE BUTTON */}
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="text-gray-500 hover:text-black p-2 hover:bg-gray-200 rounded transition"
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>

                  {/* DELETE BUTTON */}
                  <button
                    onClick={() => handleDeleteMessage(selectedMessage._id)}
                    className="text-red-600 hover:text-red-800 p-2 hover:bg-red-100 rounded transition"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* MESSAGE BODY */}
              <div className="border-t pt-6">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {selectedMessage.body || "(No Message Body)"}
                </p>
              </div>

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
    </Layout>
  );
};

export default Dashboard;
