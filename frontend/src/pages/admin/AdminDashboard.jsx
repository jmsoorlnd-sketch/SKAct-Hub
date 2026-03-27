import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import {
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  User,
  Calendar,
  Download,
  Trash2,
  X,
  FileText,
} from "lucide-react";
import { useToast } from "../../components/Toast";

/* ===================== CONSTANTS ===================== */
const API_BASE = "http://localhost:5000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/* ===================== MAIN COMPONENT ===================== */
const AdminDashboard = () => {
  const toast = useToast();
  const location = useLocation();

  /* ==================== STATE ==================== */
  const [pendingMessages, setPendingMessages] = useState([]);
  const [rejectedMessages, setRejectedMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [barangays, setBarangays] = useState([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  /* ==================== DATA FETCHING ==================== */
  useEffect(() => {
    fetchMessages();
    fetchBarangays();
  }, []);

  /* ---- Auto-refresh for pending messages (poll every 10 seconds) ---- */
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchMessages();
    }, 10000);

    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    const allMessages = [...pendingMessages, ...rejectedMessages];

    if (!loading && location?.state?.messageId && allMessages.length > 0) {
      const found = allMessages.find((m) => m._id === location.state.messageId);
      if (found) setSelectedMessage(found);
    }
  }, [loading, pendingMessages, rejectedMessages, location]);

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${API_BASE}/messages/inbox`, {
        headers: getAuthHeaders(),
      });
      const officialMessages = res.data.messages.filter(
        (msg) =>
          msg.sender?.role === "Official" &&
          !msg.isAdminScheduled &&
          ["pending", "rejected"].includes(msg.status),
      );

      setPendingMessages(
        officialMessages.filter((msg) => msg.status === "pending"),
      );
      setRejectedMessages(
        officialMessages.filter((msg) => msg.status === "rejected"),
      );
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBarangays = async () => {
    try {
      const res = await axios.get(`${API_BASE}/barangays/all-barangays`);
      setBarangays(res.data.barangays || []);
    } catch (error) {
      console.error("Failed to fetch barangays:", error);
      setBarangays([]);
    }
  };

  /* ==================== HANDLERS ==================== */
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Delete this message?")) return;

    try {
      await axios.delete(`${API_BASE}/messages/${messageId}`, {
        headers: getAuthHeaders(),
      });
      setPendingMessages((prev) => prev.filter((m) => m._id !== messageId));
      setRejectedMessages((prev) => prev.filter((m) => m._id !== messageId));
      if (selectedMessage?._id === messageId) setSelectedMessage(null);
      toast.success("Message deleted");
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete message");
    }
  };

  const handleApproveMessage = async (message = selectedMessage) => {
    if (!message?._id) return;

    try {
      await axios.post(
        `${API_BASE}/messages/admin/approve`,
        { messageId: message._id },
        { headers: getAuthHeaders() },
      );
      toast.success("Message approved and stored to barangay!");
      await fetchMessages();
      setSelectedMessage(null);
    } catch (error) {
      console.error("Approve failed:", error);
      toast.error(
        error?.response?.data?.message || "Failed to approve message",
      );
    }
  };

  const handleRejectMessage = () => {
    // open modal instead of browser confirm
    setRejectReason("");
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    const trimmedReason = rejectReason?.trim();
    if (!trimmedReason) {
      toast.warning("Please provide a reason for rejection before proceeding.");
      return;
    }

    try {
      await axios.post(
        `${API_BASE}/messages/admin/reject`,
        { messageId: selectedMessage._id, reason: trimmedReason },
        { headers: getAuthHeaders() },
      );
      toast.success("Message rejected");
      await fetchMessages();
      setSelectedMessage(null);
    } catch (error) {
      console.error("Reject failed:", error);
      toast.error(error?.response?.data?.message || "Failed to reject message");
    } finally {
      setShowRejectModal(false);
    }
  };

  /* ==================== HELPERS ==================== */
  const getBarangayName = (barangayId) => {
    const barangay = barangays.find((b) => b._id === barangayId);
    return barangay?.barangayName || "Loading...";
  };

  /* ==================== RENDER ==================== */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        {/* Page Header */}
        <div className="mb-4">
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
                  Messages for Approval
                </h1>
                <p className="text-xs sm:text-sm text-slate-600">
                  Review pending messages from officials
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                  <Mail className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600">
                    {pendingMessages.length}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">Pending</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* LEFT SIDE - Message List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 overflow-hidden">
              {/* List Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-3 sm:px-5 py-3 sm:py-4">
                <div className="flex items-center justify-between text-white flex-col sm:flex-row gap-2">
                  <div>
                    <h2 className="text-sm sm:text-base font-bold">
                      Pending Messages
                    </h2>
                    <p className="text-xs text-blue-100 mt-0.5">
                      From Officials
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold">
                      {pendingMessages.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mx-auto mb-3"></div>
                  <p className="text-sm text-slate-600 font-medium">
                    Loading...
                  </p>
                </div>
              ) : pendingMessages.length === 0 ? (
                /* Empty State */
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Mail className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 mb-1">
                    No pending messages
                  </p>
                  <p className="text-xs text-slate-500">
                    All messages have been processed
                  </p>
                </div>
              ) : (
                /* Message List */
                <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
                  {pendingMessages.map((msg) => (
                    <div
                      key={msg._id}
                      onClick={() => setSelectedMessage(msg)}
                      className={`p-4 border-b border-slate-100 cursor-pointer transition-all hover:bg-blue-50 ${
                        selectedMessage?._id === msg._id
                          ? "bg-blue-100 border-l-4 border-l-blue-600"
                          : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0 overflow-hidden border-2 border-white shadow-md">
                          {msg.sender?.profileImage ? (
                            <img
                              src={`http://localhost:5000${msg.sender.profileImage}`}
                              alt={msg.sender.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                              {msg.sender?.username?.charAt(0)?.toUpperCase() ||
                                "?"}
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-bold text-slate-900 truncate">
                              {msg.sender?.username || "Unknown"}
                            </p>
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded-md font-bold">
                              PENDING
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-700 truncate mb-1">
                            {msg.subject}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-slate-500">
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
                            {msg.attachmentNames?.length > 0 && (
                              <div className="text-slate-400">
                                <FileText className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Unread Indicator */}
                        {!msg.isRead && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rejected Messages Section */}
            <div className="mt-4 bg-white rounded-xl shadow-md border-2 border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-3 sm:px-5 py-3 sm:py-4">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <h2 className="text-sm sm:text-base font-bold">
                      Rejected Messages
                    </h2>
                    <p className="text-xs text-orange-100 mt-0.5">
                      Send back to pending
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold">
                      {rejectedMessages.length}
                    </span>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-600 border-t-transparent mx-auto mb-3"></div>
                  <p className="text-sm text-slate-600 font-medium">
                    Loading...
                  </p>
                </div>
              ) : rejectedMessages.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm font-bold text-slate-900 mb-1">
                    No rejected messages
                  </p>
                  <p className="text-xs text-slate-500">
                    Rejected messages will appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
                  {rejectedMessages.map((msg) => (
                    <div
                      key={msg._id}
                      onClick={() => setSelectedMessage(msg)}
                      className={`p-4 border-b border-slate-100 cursor-pointer transition-all hover:bg-amber-50 ${
                        selectedMessage?._id === msg._id
                          ? "bg-amber-100 border-l-4 border-l-amber-600"
                          : ""
                      }`}
                    >
                      <div className="flex items-start gap-3 justify-between">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex-shrink-0 overflow-hidden border-2 border-white shadow-md">
                            {msg.sender?.profileImage ? (
                              <img
                                src={`http://localhost:5000${msg.sender.profileImage}`}
                                alt={msg.sender.username}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                                {msg.sender?.username
                                  ?.charAt(0)
                                  ?.toUpperCase() || "?"}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">
                              {msg.sender?.username || "Unknown"}
                            </p>
                            <p className="text-xs font-semibold text-slate-700 truncate mb-1">
                              {msg.subject}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              Rejected: {msg.rejectionReason || "No reason"}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMessage(msg);
                            handleApproveMessage(msg);
                          }}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700"
                        >
                          Approve back
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE - Message Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 overflow-hidden">
              {selectedMessage ? (
                <div className="h-full flex flex-col">
                  {/* Message Header */}
                  <div className="bg-slate-50 border-b-2 border-slate-200 p-5">
                    <div className="flex justify-between items-start gap-4">
                      {/* Left: Info */}
                      <div className="flex gap-3 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0 overflow-hidden border-2 border-white shadow-md">
                          {selectedMessage.sender?.profileImage ? (
                            <img
                              src={`http://localhost:5000${selectedMessage.sender.profileImage}`}
                              alt={selectedMessage.sender.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                              {selectedMessage.sender?.username
                                ?.charAt(0)
                                ?.toUpperCase() || "?"}
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <h2 className="text-lg font-bold text-slate-900 mb-1 truncate">
                            {selectedMessage.subject}
                          </h2>
                          <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
                            <User className="w-3 h-3" />
                            <span className="font-semibold text-slate-900">
                              {selectedMessage.sender?.username || "Unknown"}
                            </span>
                            <span className="text-slate-400">•</span>
                            <Calendar className="w-3 h-3" />
                            <span>
                              {new Date(
                                selectedMessage.createdAt,
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded-md font-bold">
                              {selectedMessage.status.toUpperCase()}
                            </span>
                            {selectedMessage.attachmentNames?.length > 0 && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded-md font-bold flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                ATTACHMENT (
                                {selectedMessage.attachmentNames.length})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() =>
                            handleDeleteMessage(selectedMessage._id)
                          }
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedMessage(null)}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Close"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Scrollable Content */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {/* Message Body */}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-600" />
                        Message Content
                      </h3>
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">
                          {selectedMessage.body}
                        </p>
                      </div>
                    </div>
                    {/* Rejection reason (if previously rejected) */}
                    {selectedMessage.status === "rejected" &&
                      selectedMessage.rejectionReason && (
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 mb-2">
                            Rejection Reason
                          </h3>
                          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">
                              {selectedMessage.rejectionReason}
                            </p>
                          </div>
                        </div>
                      )}

                    {/* Activity Schedule */}
                    {(selectedMessage.startDate || selectedMessage.endDate) && (
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          Activity Schedule
                        </h3>
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {selectedMessage.startDate && (
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Clock className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div>
                                  <p className="text-[10px] text-slate-600 font-semibold">
                                    Start Date
                                  </p>
                                  <p className="text-xs text-slate-900 font-bold">
                                    {new Date(
                                      selectedMessage.startDate,
                                    ).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            )}
                            {selectedMessage.endDate && (
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Clock className="w-4 h-4 text-red-600" />
                                </div>
                                <div>
                                  <p className="text-[10px] text-slate-600 font-semibold">
                                    End Date
                                  </p>
                                  <p className="text-xs text-slate-900 font-bold">
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

                    {/* Attachment */}
                    {selectedMessage.attachmentNames?.length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600" />
                          Attachments ({selectedMessage.attachmentNames.length})
                        </h3>
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-3">
                          {selectedMessage.attachmentNames.map(
                            (name, index) => {
                              const url =
                                selectedMessage.attachmentUrls?.[index];
                              return (
                                <div
                                  key={`${name}-${index}`}
                                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200"
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                                      <FileText className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-bold text-slate-900 truncate">
                                        {name}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        Click to download
                                      </p>
                                    </div>
                                  </div>
                                  {url && (
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <button
                                        onClick={() => {
                                          setPreviewUrl(
                                            `http://localhost:5000${url}`,
                                          );
                                          setShowPreviewModal(true);
                                        }}
                                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                      >
                                        <FileText className="w-3 h-3" />
                                        View
                                      </button>
                                      <a
                                        href={`http://localhost:5000${url}`}
                                        download={name}
                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        <Download className="w-3 h-3" />
                                        Download
                                      </a>
                                    </div>
                                  )}
                                </div>
                              );
                            },
                          )}
                        </div>
                      </div>
                    )}

                    {/* Approval Section */}
                    {selectedMessage.status === "pending" && (
                      <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                          </div>
                          <h4 className="text-base font-bold text-emerald-900">
                            Ready for Approval
                          </h4>
                        </div>

                        <div className="mb-4 p-3 bg-white rounded-lg border border-emerald-200">
                          <p className="text-xs text-slate-600 mb-1 font-semibold">
                            Target Barangay:
                          </p>
                          <p className="text-sm font-bold text-slate-900">
                            {getBarangayName(
                              selectedMessage.attachedToBarangay,
                            )}
                          </p>
                        </div>

                        {selectedMessage.intendedFolder && (
                          <div className="mb-4 p-3 bg-white rounded-lg border border-emerald-200">
                            <p className="text-xs text-slate-600 mb-1 font-semibold">
                              Target Folder:
                            </p>
                            <p className="text-sm font-bold text-slate-900">
                              {selectedMessage.intendedFolder.name ||
                                "Unknown Folder"}
                            </p>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={handleRejectMessage}
                            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1.5"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                          <button
                            onClick={() =>
                              handleApproveMessage(selectedMessage)
                            }
                            className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedMessage.status === "rejected" && (
                      <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                            <XCircle className="w-4 h-4 text-amber-700" />
                          </div>
                          <h4 className="text-base font-bold text-amber-900">
                            Rejected Message
                          </h4>
                        </div>

                        <div className="mb-4 p-3 bg-white rounded-lg border border-amber-200">
                          <p className="text-xs text-slate-600 mb-1 font-semibold">
                            Rejection Reason:
                          </p>
                          <p className="text-sm font-bold text-slate-900">
                            {selectedMessage.rejectionReason ||
                              "No reason provided"}
                          </p>
                        </div>

                        <button
                          onClick={() => handleApproveMessage(selectedMessage)}
                          className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-lg text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve back
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Empty Selection State */
                <div className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-10 h-10 text-slate-400" />
                    </div>
                    <p className="text-base font-bold text-slate-900 mb-1">
                      Select a message
                    </p>
                    <p className="text-sm text-slate-500">
                      Choose from the pending messages
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reject confirmation modal with reason input */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" />
          <div className="bg-white rounded-lg shadow-lg z-50 w-11/12 md:w-1/3 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Reject Message</h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-gray-600 hover:text-black"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-700 mb-2">
              Are you sure you want to reject this message? A rejection reason
              is required, because it helps the sender improve and track the
              decision.
            </p>
            <textarea
              className="w-full border rounded p-2 mb-4"
              rows={3}
              placeholder="Reason for rejection"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-11/12 max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 p-6 sticky top-0">
              <h3 className="text-lg font-bold text-white">Preview</h3>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {previewUrl && (
                <>
                  {previewUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full h-auto rounded-lg border border-slate-200"
                    />
                  ) : previewUrl.match(/\.pdf$/i) ? (
                    <iframe
                      src={previewUrl}
                      className="w-full h-96 rounded-lg border border-slate-200"
                      title="PDF Preview"
                    />
                  ) : previewUrl.match(/\.(doc|docx)$/i) ? (
                    <div className="p-6 bg-slate-100 rounded-lg border border-slate-200 text-center">
                      <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-700 mb-4">
                        Document preview not supported in browser.
                      </p>
                      <a
                        href={previewUrl}
                        download
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download to View
                      </a>
                    </div>
                  ) : (
                    <div className="p-6 bg-slate-100 rounded-lg border border-slate-200 text-center">
                      <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-700 mb-4">
                        File preview not supported.
                      </p>
                      <a
                        href={previewUrl}
                        download
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download File
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
