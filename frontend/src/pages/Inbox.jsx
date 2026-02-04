import React, { useState, useEffect } from "react";
import axios from "axios";
import Layout from "../layout/Layout";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

const Inbox = () => {
  console.log("🔵 INBOX COMPONENT LOADED");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSentMessages();
  }, []);

  const fetchSentMessages = async () => {
    try {
      setError(null);
      const token = localStorage.getItem("token");
      console.log("Fetching sent messages with token:", token ? "✓" : "✗");

      const res = await axios.get("http://localhost:5000/api/messages/sent", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("API Response:", res.data);
      const fetchedMessages = res.data.messages || [];
      console.log("Sent messages fetched:", fetchedMessages.length);

      if (fetchedMessages.length === 0) {
        console.warn(
          "No messages found. You may not have sent any messages yet.",
        );
      }

      setMessages(fetchedMessages);
    } catch (error) {
      console.error(
        "Failed to fetch messages:",
        error.response?.data || error.message,
      );
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to load messages",
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300";
      case "ongoing":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "completed":
        return "bg-purple-100 text-purple-800 border-purple-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <CheckCircle size={20} className="text-green-600" />;
      case "rejected":
        return <XCircle size={20} className="text-red-600" />;
      case "ongoing":
        return <Clock size={20} className="text-blue-600 animate-spin" />;
      case "pending":
        return (
          <AlertCircle size={20} className="text-yellow-600 animate-pulse" />
        );
      case "completed":
        return <CheckCircle size={20} className="text-purple-600" />;
      default:
        return <AlertCircle size={20} className="text-gray-600" />;
    }
  };

  return (
    <Layout>
      <div className="w-full p-6 bg-gray-50 min-h-screen">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Inbox</h1>
          <p className="text-gray-600 mt-2">Messages sent for approval</p>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="font-semibold">Error loading messages:</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={fetchSentMessages}
              className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">No messages sent yet</p>
            <p className="text-gray-400 text-sm mt-2">
              Messages you send for approval will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg._id}
                className="bg-white rounded-lg shadow p-6 border-l-4 border-l-gray-200 hover:shadow-lg transition"
              >
                {/* TITLE AND STATUS ROW */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-900">
                    {msg.subject}
                  </h3>
                  <span
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border shrink-0 ml-4 ${getStatusColor(
                      msg.status,
                    )}`}
                  >
                    {getStatusIcon(msg.status)}
                    {msg.status.charAt(0).toUpperCase() + msg.status.slice(1)}
                  </span>
                </div>

                {/* RECIPIENT */}
                <p className="text-sm text-gray-600 mb-3">
                  To:{" "}
                  <span className="font-semibold">
                    {msg.recipient?.username || "Admin"}
                  </span>
                </p>

                {/* MESSAGE CONTENT */}
                <div className="text-gray-700 mb-4 whitespace-pre-wrap break-words">
                  {msg.body}
                </div>

                {/* ATTACHMENT IF EXISTS */}
                {(msg.isAttached && msg.attachmentUrl) || msg.attachmentName ? (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-gray-600 font-semibold mb-2">ATTACHMENT</p>
                    <a
                      href={`http://localhost:5000${msg.attachmentUrl}`}
                      download
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold text-sm hover:underline"
                    >
                      📎 {msg.attachmentName || "Download file"}
                    </a>
                  </div>
                ) : null}

                {/* TIMESTAMP */}
                <div className="text-xs text-gray-500 flex justify-between items-center pt-3 border-t">
                  <span>{new Date(msg.createdAt).toLocaleString()}</span>
                  {msg.status === "approved" && (
                    <span className="text-green-600 font-semibold">
                      Approved
                    </span>
                  )}
                  {msg.status === "rejected" && (
                    <span className="text-red-600 font-semibold">Rejected</span>
                  )}
                  {msg.status === "pending" && (
                    <span className="text-yellow-600 font-semibold">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Inbox;
