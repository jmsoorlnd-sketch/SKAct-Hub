import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";

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

  const location = useLocation();

  // If navigated with a messageId (from notifications), pre-select that message
  useEffect(() => {
    if (!loading && location?.state?.messageId && messages.length > 0) {
      const found = messages.find((m) => m._id === location.state.messageId);
      if (found) setSelectedMessage(found);
    }
  }, [loading, messages, location]);

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
    <>
      <div className="w-full p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        {/* ENHANCED HEADER */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Messages for Approval
              </h1>
              <p className="text-gray-600 text-lg">
                Review pending messages from officials and approve them to store
                in barangay storage
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  {messages.length}
                </p>
                <p className="text-sm text-gray-500">Pending Messages</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-full gap-8">
          {/* ENHANCED LEFT SIDE - MESSAGE LIST */}
          <div className="w-1/3 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
            <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Pending Messages</h2>
                  <p className="text-blue-100 text-sm mt-1">From Officials</p>
                </div>
                <div className="bg-white/20 px-3 py-1 rounded-full">
                  <span className="font-bold">{messages.length}</span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading messages...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4-4-4m4 4V3"
                    />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">No pending messages</p>
                <p className="text-gray-400 text-sm mt-1">
                  All messages have been processed
                </p>
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[75vh]">
                {messages.map((msg) => (
                  <div
                    key={msg._id}
                    onClick={() => setSelectedMessage(msg)}
                    className={`p-5 border-b border-gray-100 cursor-pointer transition-all duration-300 group hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent hover:shadow-lg hover:border-l-4 hover:border-l-blue-500 ${
                      selectedMessage?._id === msg._id
                        ? "bg-gradient-to-r from-blue-100 to-indigo-50 border-l-4 border-l-blue-600 shadow-lg"
                        : "hover:translate-x-2"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3 flex-1">
                        {/* Mini profile image */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex-shrink-0 overflow-hidden border-2 border-white shadow-md">
                          {msg.sender?.profileImage ? (
                            <img
                              src={`http://localhost:5000${msg.sender.profileImage}`}
                              alt={msg.sender.username}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs transition-transform duration-300 group-hover:scale-110">
                              {msg.sender?.username?.charAt(0)?.toUpperCase() ||
                                "?"}
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-900 text-sm">
                              {msg.sender?.username || "Unknown"}
                            </p>
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                              Pending
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 font-medium truncate mb-1">
                            {msg.subject}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(msg.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {!msg.isRead && (
                          <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
                        )}
                        {msg.attachmentName && (
                          <div className="text-gray-400">
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
                                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ENHANCED RIGHT SIDE - MESSAGE DETAILS */}
          <div className="w-2/3 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {selectedMessage ? (
              <div className="h-full flex flex-col">
                {/* ENHANCED HEADER */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-6">
                  <div className="flex justify-between items-start">
                    {/* LEFT SIDE: PROFILE PHOTO + SUBJECT + INFO */}
                    <div className="flex gap-5">
                      {/* Enhanced Profile Photo */}
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 shrink-0 overflow-hidden border-3 border-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                        {selectedMessage.sender?.profileImage ? (
                          <img
                            src={`http://localhost:5000${selectedMessage.sender.profileImage}`}
                            alt={selectedMessage.sender.username}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-bold text-2xl">
                            {selectedMessage.sender?.username
                              ?.charAt(0)
                              ?.toUpperCase() || "?"}
                          </div>
                        )}
                      </div>

                      {/* Subject + Info */}
                      <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                          {selectedMessage.subject}
                        </h2>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <p>
                            From:{" "}
                            <span className="font-semibold text-gray-800">
                              {selectedMessage.sender?.username || "Unknown"}
                            </span>
                          </p>
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          <p>
                            {new Date(selectedMessage.createdAt).toLocaleString(
                              "en-US",
                              {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full font-medium">
                            {selectedMessage.status.toUpperCase()}
                          </span>
                          {selectedMessage.attachmentName && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium flex items-center gap-1">
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                />
                              </svg>
                              Attachment
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT SIDE: ENHANCED BUTTON GROUP */}
                    <div className="flex gap-2">
                      {/* CLOSE BUTTON */}
                      <button
                        onClick={() => setSelectedMessage(null)}
                        className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-200 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-md active:scale-95"
                        title="Close message"
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>

                      {/* DELETE BUTTON */}
                      <button
                        onClick={() => handleDeleteMessage(selectedMessage._id)}
                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-red-200 active:scale-95"
                        title="Delete message"
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>

                      {/* REJECT BUTTON */}
                      <button
                        onClick={handleRejectMessage}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-red-500/50 hover:scale-105 font-medium active:scale-95 hover:-translate-y-0.5"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>

                {/* SCROLLABLE CONTENT AREA */}
                <div className="flex-1 overflow-y-auto p-6">
                  {/* MESSAGE BODY */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Message Content
                    </h3>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300">
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {selectedMessage.body}
                      </p>
                    </div>
                  </div>

                  {/* ACTIVITY DATES */}
                  {(selectedMessage.startDate || selectedMessage.endDate) && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Activity Schedule
                      </h3>
                      <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedMessage.startDate && (
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <svg
                                  className="w-5 h-5 text-green-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600">
                                  Starts
                                </p>
                                <p className="text-gray-900 font-semibold">
                                  {new Date(
                                    selectedMessage.startDate,
                                  ).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )}
                          {selectedMessage.endDate && (
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <svg
                                  className="w-5 h-5 text-red-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-600">
                                  Ends
                                </p>
                                <p className="text-gray-900 font-semibold">
                                  {new Date(
                                    selectedMessage.endDate,
                                  ).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ATTACHMENT SECTION */}
                  {selectedMessage.attachmentName && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Attachments
                      </h3>
                      <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-lg hover:border-blue-200 transition-all duration-300 hover:translate-x-1">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <svg
                                className="w-5 h-5 text-blue-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                />
                              </svg>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">
                                {selectedMessage.attachmentName}
                              </p>
                              <p className="text-sm text-gray-500">
                                Click to download
                              </p>
                            </div>
                          </div>
                          {selectedMessage.attachmentUrl && (
                            <a
                              href={`http://localhost:5000${selectedMessage.attachmentUrl}`}
                              download={selectedMessage.attachmentName}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50 font-medium active:scale-95 hover:-translate-y-0.5"
                              target="_blank"
                              rel="noreferrer"
                            >
                              Download
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ENHANCED BARANGAY SELECTOR & APPROVE SECTION */}
                  {selectedMessage.status === "pending" && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 hover:border-green-300 hover:shadow-lg transition-all duration-300 hover:from-green-100 hover:to-emerald-100 group/approve">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <svg
                            className="w-5 h-5 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <h4 className="text-xl font-bold text-green-900">
                          Ready for Approval
                        </h4>
                      </div>

                      <div className="mb-4 p-4 bg-white rounded-lg border border-green-200">
                        <p className="text-sm text-gray-600 mb-2">
                          Target Barangay:
                        </p>
                        <p className="text-lg font-semibold text-gray-800">
                          {barangays.find(
                            (b) => b._id === selectedMessage.attachedToBarangay,
                          )?.barangayName || (
                            <span className="text-gray-500">Loading...</span>
                          )}
                        </p>
                      </div>

                      <button
                        onClick={handleApproveMessage}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/50 flex items-center justify-center gap-3 active:scale-95 hover:-translate-y-1 group/btn"
                      >
                        <svg
                          className="w-6 h-6 transition-transform duration-300 group-hover/btn:rotate-12"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="transition-transform duration-300 group-hover/btn:tracking-wide">
                          Approve & Store to Barangay
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                      className="w-12 h-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <p className="text-xl font-medium text-gray-600 mb-2">
                    Select a message to view details
                  </p>
                  <p className="text-gray-400">
                    Choose from the pending messages on the left
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
