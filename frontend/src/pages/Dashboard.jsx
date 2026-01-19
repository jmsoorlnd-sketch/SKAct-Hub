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
          },
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
          },
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
        { headers: { Authorization: `Bearer ${token}` } },
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
        {/* DASHBOARD CONTENT */}
        <div className="w-full bg-white rounded-xl shadow-md p-6 overflow-auto max-h-[80vh]">
          <h1 className="text-3xl font-bold mb-6">Welcome to Dashboard</h1>
          <p className="text-gray-600">Dashboard content goes here</p>
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
                                },
                              );

                              setMessages((prev) =>
                                prev.filter((m) => m._id !== messageId),
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
                                  "Failed to attach message",
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
