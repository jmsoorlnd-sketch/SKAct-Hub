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

        // Ensure messages array
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

        {/* RIGHT SIDE - MESSAGE DETAIL */}
        <div className="w-2/3 bg-white rounded-xl shadow-md p-6 overflow-auto max-h-[80vh]">
          {selectedMessage ? (
            <>
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
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L19.18 2.318a2.25 2.25 0 00-2.163-1.318h-5.034a2.25 2.25 0 00-2.163 1.318L5.31 5.807M2 9h21M4.615 8.585a2.25 2.25 0 00-1.423 2.049v6.289a2.25 2.25 0 002.25 2.25h10.716a2.25 2.25 0 002.25-2.25v-6.289a2.25 2.25 0 00-1.423-2.049m-17.306 0a2.25 2.25 0 011.423-2.049m17.306 0a2.25 2.25 0 00-1.423-2.049M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                    />
                  </svg>
                </button>
              </div>

              <div className="border-t pt-6">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {selectedMessage.body || "(No Message Body)"}
                </p>
              </div>

              {selectedMessage.attachmentName && (
                <div className="mt-6 p-4 bg-gray-100 rounded-lg border border-gray-300">
                  <p className="text-sm text-gray-600 mb-2">Attachment:</p>
                  <p className="text-sm font-semibold text-gray-800">
                    📎 {selectedMessage.attachmentName}
                  </p>
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
