import React, { useState, useEffect } from "react";
import axios from "axios";
import Layout from "../layout/Layout";
import { useToast } from "../components/Toast";

const Dashboard = () => {
  const { success, error } = useToast();
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState(null);
  const [showBarangayModal, setShowBarangayModal] = useState(false);
  const [barangays, setBarangays] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [messageToAttach, setMessageToAttach] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

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

    // load current user from localStorage defensively
    try {
      const raw = localStorage.getItem("user");
      setCurrentUser(raw ? JSON.parse(raw) : null);
    } catch (err) {
      setCurrentUser(null);
    }
  }, []);

  // close context menu on click anywhere
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  // Listen for detached messages and refresh inbox
  useEffect(() => {
    const onDetached = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/messages/inbox",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setMessages(res.data.messages || []);
      } catch (err) {
        console.error("Failed to refresh inbox after detach", err);
      } finally {
        setLoading(false);
      }
    };

    window.addEventListener("messageDetached", onDetached);
    return () => window.removeEventListener("messageDetached", onDetached);
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
      success("Message deleted");
    } catch (err) {
      console.error("Delete failed:", err);
      error("Failed to delete message");
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
    } catch (err) {
      console.error("Update status failed:", err);
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
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({
                      x: e.pageX,
                      y: e.pageY,
                      message: msg,
                    });
                  }}
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

        {/* Context menu */}
        {contextMenu && (
          <div
            className="absolute bg-white border rounded shadow-md z-50"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              className="px-4 py-2 hover:bg-gray-100 w-full text-left"
              onClick={(e) => {
                e.stopPropagation();
                setMessageToAttach(contextMenu?.message || null);
                setShowBarangayModal(true);
                setContextMenu(null);
                (async () => {
                  try {
                    setModalLoading(true);
                    const token = localStorage.getItem("token");
                    const res = await axios.get(
                      "http://localhost:5000/api/barangays/all-barangays",
                      {
                        headers: { Authorization: `Bearer ${token}` },
                      }
                    );
                    setBarangays(res.data.barangays || res.data || []);
                  } catch (err) {
                    console.error("Failed to load barangays", err);
                    error("Failed to load barangays");
                    setBarangays([]);
                  } finally {
                    setModalLoading(false);
                  }
                })();
              }}
            >
              Insert in a brgy
            </button>
          </div>
        )}

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

              {/* Status controls (only visible to sender) */}
              {currentUser &&
                selectedMessage.sender &&
                String(currentUser._id) ===
                  String(selectedMessage.sender._id) && (
                  <div className="mt-4 flex gap-2">
                    <button
                      className="px-3 py-1 bg-yellow-500 text-white rounded"
                      onClick={() =>
                        handleUpdateStatus(selectedMessage._id, "ongoing")
                      }
                    >
                      Mark Ongoing
                    </button>
                    <button
                      className="px-3 py-1 bg-green-600 text-white rounded"
                      onClick={() =>
                        handleUpdateStatus(selectedMessage._id, "completed")
                      }
                    >
                      Mark Completed
                    </button>
                  </div>
                )}

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

      {/* Barangay Modal */}
      {showBarangayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" />
          <div className="bg-white rounded-lg shadow-lg z-50 w-11/12 md:w-1/2 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Select Barangay</h3>
              <button
                onClick={() => setShowBarangayModal(false)}
                className="text-gray-600 hover:text-black"
              >
                ✕
              </button>
            </div>

            {modalLoading ? (
              <div className="text-center text-gray-600">Loading...</div>
            ) : (
              <div className="max-h-80 overflow-auto">
                {barangays.length === 0 ? (
                  <div className="text-gray-500">No barangays found</div>
                ) : (
                  barangays.map((b) => (
                    <div
                      key={b._id}
                      className="flex items-center justify-between p-3 border-b"
                    >
                      <div>
                        <div className="font-semibold">
                          {b.barangayName || b.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {b.city ? `${b.city} • ${b.region}` : b.region || ""}
                        </div>
                      </div>
                      <div>
                        <button
                          className="bg-blue-600 text-white px-3 py-1 rounded"
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem("token");
                              const messageId = messageToAttach?._id || null;
                              if (!messageId) {
                                error("No message selected");
                                return;
                              }

                              await axios.post(
                                `http://localhost:5000/api/barangays/${b._id}/attach-message`,
                                { messageId },
                                {
                                  headers: { Authorization: `Bearer ${token}` },
                                }
                              );

                              setMessages((prev) =>
                                prev.filter((m) => m._id !== messageId)
                              );
                              if (selectedMessage?._id === messageId)
                                setSelectedMessage(null);

                              success("Message attached to barangay");
                              setShowBarangayModal(false);
                              setMessageToAttach(null);
                            } catch (err) {
                              console.error("Attach failed", err);
                              error(
                                err.response?.data?.message ||
                                  "Failed to attach message"
                              );
                            }
                          }}
                        >
                          Insert
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;
