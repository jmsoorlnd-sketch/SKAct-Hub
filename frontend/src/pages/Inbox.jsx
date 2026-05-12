import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import axios from "axios";
import { useSocket } from "../context/SocketContext";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Mail,
  Calendar,
  Paperclip,
  RefreshCw,
  Inbox as InboxIcon,
  Send,
  ArrowDownLeft,
} from "lucide-react";

/* ===================== CONSTANTS ===================== */
const API_BASE = window.API_BASE;

/* ===================== STATUS CONFIG ===================== */
const STATUS_CONFIG = {
  approved: {
    color: "from-emerald-100 to-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle,
    label: "Approved",
  },
  rejected: {
    color: "from-red-100 to-red-50 text-red-700 border-red-200",
    icon: XCircle,
    label: "Rejected",
  },
  ongoing: {
    color: "from-blue-100 to-blue-50 text-blue-700 border-blue-200",
    icon: Clock,
    label: "Ongoing",
    animate: true,
  },
  pending: {
    color: "from-amber-100 to-amber-50 text-amber-700 border-amber-200",
    icon: AlertCircle,
    label: "Pending",
  },
  cancelled: {
    color: "from-red-100 to-red-50 text-red-700 border-red-200",
    icon: XCircle,
    label: "Cancelled",
  },
  completed: {
    color: "from-purple-100 to-purple-50 text-purple-700 border-purple-200",
    icon: CheckCircle,
    label: "Completed",
  },
};

const DEFAULT_STATUS = {
  color: "from-slate-100 to-slate-50 text-slate-700 border-slate-200",
  icon: AlertCircle,
  label: "Unknown",
};

const getDisplayName = (user, fallback = "Unknown") => {
  if (!user) return fallback;

  const fullName =
    user.firstname || user.lastname
      ? `${user.firstname || ""} ${user.lastname || ""}`.trim()
      : "";

  return fullName || user.username || user.email || fallback;
};

/* ===================== MAIN COMPONENT ===================== */
const Inbox = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sentMessages, setSentMessages] = useState([]);
  const [receivedMessages, setReceivedMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const { socket, isConnected } = useSocket();
  const messagesRef = useRef({ sent: [], received: [] });

  // Keep refs in sync
  useEffect(() => {
    messagesRef.current = { sent: sentMessages, received: receivedMessages };
  }, [sentMessages, receivedMessages]);

  /* ===================== MEMO ===================== */
  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  /* ===================== FETCH FUNCTIONS ===================== */
  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!authHeaders.Authorization) {
        throw new Error("No authentication token found. Please log in again.");
      }

      const [sentRes, receivedRes] = await Promise.all([
        axios.get(`${API_BASE}/messages/sent`, { headers: authHeaders }),
        axios.get(`${API_BASE}/messages/inbox`, { headers: authHeaders }),
      ]);

      setSentMessages(sentRes.data.messages || []);
      setReceivedMessages(receivedRes.data.messages || []);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load messages.",
      );
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  // Update a single message in the state - OPTIMISTIC UPDATE
  const updateMessageStatus = useCallback(
    (messageId, newStatus, rejectionReason = null) => {
      console.log(`🔄 Updating message ${messageId} to status: ${newStatus}`);

      // Update in sent messages
      setSentMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? {
                ...msg,
                status: newStatus,
                ...(rejectionReason && { rejectionReason }),
              }
            : msg,
        ),
      );

      // Update in received messages
      setReceivedMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? {
                ...msg,
                status: newStatus,
                ...(rejectionReason && { rejectionReason }),
              }
            : msg,
        ),
      );

      // Show toast notification
      showToast(`Message status updated to ${newStatus}`, "success");
    },
    [],
  );

  // Show toast notification
  const showToast = (message, type = "info") => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  /* ===================== SOCKET EVENT HANDLERS ===================== */
  const handleMessageStatusUpdate = useCallback(
    (data) => {
      console.log("📨 Message status updated via socket:", data);

      // Update the message status in state
      updateMessageStatus(data.messageId, data.status, data.rejectionReason);

      // Show notification
      if (data.message) {
        showToast(data.message, "info");
      }

      // If the selected message is the one being updated, refresh its details
      if (selectedMessage && selectedMessage._id === data.messageId) {
        // Find the updated message from current state
        const updatedMsg = [...sentMessages, ...receivedMessages].find(
          (m) => m._id === data.messageId,
        );
        if (updatedMsg) {
          setSelectedMessage(updatedMsg);
        }
      }
    },
    [updateMessageStatus, selectedMessage, sentMessages, receivedMessages],
  );

  const handleNewMessage = useCallback(
    (data) => {
      console.log("📬 New message received via socket:", data);

      if (data.data && data.data._id) {
        // Add to received messages if not already present
        setReceivedMessages((prev) => {
          const exists = prev.some((msg) => msg._id === data.data._id);
          if (!exists) {
            showToast(`New message: ${data.data.subject}`, "info");
            return [data.data, ...prev];
          }
          return prev;
        });
      }

      // Refresh to ensure consistency
      fetchMessages();
    },
    [fetchMessages],
  );

  const handleNewNotification = useCallback(
    (notification) => {
      console.log("🔔 New notification received:", notification);
      // Refresh messages to get updated status
      fetchMessages();

      if (notification.title) {
        showToast(notification.title, "info");
      }
    },
    [fetchMessages],
  );

  /* ===================== INITIAL LOAD & SOCKET SETUP ===================== */
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Socket event listeners
  useEffect(() => {
    if (socket && isConnected) {
      console.log("✅ Setting up inbox socket listeners...");

      socket.on("message-status-updated", handleMessageStatusUpdate);
      socket.on("new-message", handleNewMessage);
      socket.on("new-notification", handleNewNotification);

      return () => {
        console.log("🧹 Cleaning up inbox socket listeners...");
        socket.off("message-status-updated", handleMessageStatusUpdate);
        socket.off("new-message", handleNewMessage);
        socket.off("new-notification", handleNewNotification);
      };
    }
  }, [
    socket,
    isConnected,
    handleMessageStatusUpdate,
    handleNewMessage,
    handleNewNotification,
  ]);

  // Polling fallback - every 30 seconds if socket not connected
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isConnected) {
        console.log("⚠️ Socket not connected, polling for updates...");
        fetchMessages();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isConnected, fetchMessages]);

  /* ===================== API CALLS ===================== */
  const handleUpdateMessageStatus = async (
    messageId,
    status,
    reason = null,
  ) => {
    if (!messageId) return;

    try {
      const token = localStorage.getItem("token");
      const payload = { status };
      if (reason) payload.reason = reason;

      // Optimistic update first
      updateMessageStatus(messageId, status, reason);

      // Make API call
      await axios.put(`${API_BASE}/messages/${messageId}/status`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Socket will handle additional updates, but refresh to be safe
      setTimeout(() => fetchMessages(), 1000);
    } catch (err) {
      console.error("Failed to update message status:", err);
      showToast("Failed to update status. Please try again.", "error");
      // Revert optimistic update by refreshing
      fetchMessages();
    }
  };

  const confirmAndUpdateMessageStatus = async (messageId, status) => {
    if (!messageId) return;

    if (status === "cancelled") {
      const confirmed = window.confirm(
        "Are you sure you want to cancel this message submission? This action cannot be undone.",
      );
      if (!confirmed) return;
    }

    if (status === "rejected") {
      const reason = prompt("Please provide a reason for rejection:");
      if (!reason) return;
      await handleUpdateMessageStatus(messageId, status, reason);
    } else {
      await handleUpdateMessageStatus(messageId, status);
    }
  };

  /* ===================== DERIVED DATA ===================== */
  const messages = useMemo(() => {
    const sentWithSource = sentMessages.map((m) => ({ ...m, _source: "sent" }));
    const receivedWithSource = receivedMessages.map((m) => ({
      ...m,
      _source: "received",
    }));

    if (activeTab === "sent") return sentWithSource;
    if (activeTab === "received") return receivedWithSource;

    return [...receivedWithSource, ...sentWithSource].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
  }, [activeTab, sentMessages, receivedMessages]);

  const getDisplayName = useCallback((user, fallback = "Unknown") => {
    if (!user) return fallback;

    const fullName =
      user.firstname || user.lastname
        ? `${user.firstname || ""} ${user.lastname || ""}`.trim()
        : "";

    return fullName || user.username || user.email || fallback;
  }, []);

  const filteredMessages = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const statusFiltered =
      statusFilter === "all"
        ? messages
        : messages.filter((m) => m.status === statusFilter);

    if (!normalizedQuery) return statusFiltered;

    return statusFiltered.filter((m) => {
      const searchable = [
        m.subject,
        m.body,
        getDisplayName(m.sender),
        getDisplayName(m.recipient),
        m.status,
        m._source,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [messages, statusFilter, searchQuery, getDisplayName]);

  const statusToggleOptions = [
    "all",
    "pending",
    "approved",
    "rejected",
    "ongoing",
    "completed",
    "cancelled",
  ];

  const stats = useMemo(() => {
    const counts = {
      total: messages.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      ongoing: 0,
      completed: 0,
      cancelled: 0,
      other: 0,
    };

    messages.forEach((m) => {
      const s = m.status || "other";
      if (counts[s] !== undefined) counts[s]++;
      else counts.other++;
    });

    return counts;
  }, [messages]);

  const adminEventCount = useMemo(
    () => receivedMessages.filter((m) => m.isAdminScheduled).length,
    [receivedMessages],
  );

  /* ===================== HELPERS ===================== */
  const getStatusConfig = useCallback(
    (status) => STATUS_CONFIG[status] || DEFAULT_STATUS,
    [],
  );

  const getAttachments = useCallback((message) => {
    if (!message) return [];

    const attachments = [];

    // Newer format: array of URLs/names
    if (message.attachmentUrls?.length > 0) {
      message.attachmentUrls.forEach((url, index) => {
        attachments.push({
          url,
          name: message.attachmentNames?.[index] || `Attachment ${index + 1}`,
        });
      });
      return attachments;
    }

    // Legacy single attachment fields
    if (message.attachmentUrl) {
      attachments.push({
        url: message.attachmentUrl,
        name: message.attachmentName || "Attachment",
      });
      return attachments;
    }

    // Possible old style attachment field
    if (message.attachment) {
      attachments.push({
        url: message.attachment.url || message.attachmentUrl || null,
        name: message.attachment.name || message.attachmentName || "Attachment",
      });
      return attachments;
    }

    return attachments;
  }, []);

  /* ==================== RENDER ==================== */
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all ${
              toastMessage.type === "error"
                ? "bg-red-500 text-white"
                : toastMessage.type === "success"
                  ? "bg-green-500 text-white"
                  : "bg-blue-500 text-white"
            }`}
          >
            {toastMessage.message}
          </div>
        )}

        {/* Connection Status */}
        {!isConnected && (
          <div className="mb-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-600 border-t-transparent"></div>
            <span>Connecting to real-time updates...</span>
          </div>
        )}

        {isConnected && (
          <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
            <span>Connected to real-time updates</span>
          </div>
        )}

        <div className="mb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3">
                <div className="w-8 sm:w-10 h-8 sm:h-10 bg-linear-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                  <InboxIcon className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
                </div>
                Messages
              </h1>
              <p className="text-slate-600 mt-1 text-xs sm:text-sm">
                {activeTab === "sent"
                  ? "Track your submitted messages and approval status"
                  : "View received messages and admin notifications"}
              </p>
            </div>
            <button
              onClick={fetchMessages}
              disabled={loading}
              className="px-3 sm:px-4 py-2 bg-white hover:bg-slate-50 border-2 border-slate-200 rounded-lg font-semibold text-xs sm:text-sm text-slate-700 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 whitespace-nowrap"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="flex gap-2 mb-4 border-b-2 border-slate-200">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 font-semibold text-sm transition-all border-b-2 ${
                activeTab === "all"
                  ? "text-blue-600 border-blue-600"
                  : "text-slate-600 border-transparent hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <InboxIcon size={16} />
                All ({receivedMessages.length + sentMessages.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab("received")}
              className={`px-4 py-2 font-semibold text-sm transition-all border-b-2 ${
                activeTab === "received"
                  ? "text-blue-600 border-blue-600"
                  : "text-slate-600 border-transparent hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <ArrowDownLeft size={16} />
                Received ({receivedMessages.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab("sent")}
              className={`px-4 py-2 font-semibold text-sm transition-all border-b-2 ${
                activeTab === "sent"
                  ? "text-blue-600 border-blue-600"
                  : "text-slate-600 border-transparent hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2">
                <Send size={16} />
                Sent ({sentMessages.length})
              </div>
            </button>
          </div>

          {/* Status Filter Buttons */}
          <div className="grid gap-3 md:grid-cols-[1fr_auto] items-center mb-4">
            <div className="relative">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                type="text"
                placeholder="Search by subject, body, sender, or status"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 pr-12 text-sm text-slate-800 shadow-sm focus:border-blue-400 focus:outline-none focus:ring focus:ring-blue-100"
              />
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                <span className="text-sm">Search</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {statusToggleOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setStatusFilter(option)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    statusFilter === option
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {option === "all"
                    ? "All"
                    : option.charAt(0).toUpperCase() + option.slice(1)}
                  {option !== "all" && stats[option] > 0 && (
                    <span className="ml-1 inline-flex h-5 items-center justify-center rounded-full bg-slate-100 px-2 text-[10px] text-slate-700">
                      {stats[option]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            {activeTab === "sent" ? (
              <>
                <StatCard
                  icon={Send}
                  title="Total Sent"
                  value={stats.total}
                  color="blue"
                />
                <StatCard
                  icon={AlertCircle}
                  title="Pending"
                  value={stats.pending}
                  color="amber"
                />
                <StatCard
                  icon={CheckCircle}
                  title="Approved"
                  value={stats.approved}
                  color="emerald"
                />
                <StatCard
                  icon={XCircle}
                  title="Rejected"
                  value={stats.rejected}
                  color="red"
                />
              </>
            ) : (
              <>
                <StatCard
                  icon={Mail}
                  title="Total Received"
                  value={stats.total}
                  color="blue"
                />
                <StatCard
                  icon={Calendar}
                  title="Admin Events"
                  value={adminEventCount}
                  color="purple"
                />
                <StatCard
                  icon={AlertCircle}
                  title="Pending"
                  value={stats.pending}
                  color="amber"
                />
                <StatCard
                  icon={CheckCircle}
                  title="Approved"
                  value={stats.approved}
                  color="emerald"
                />
              </>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-white rounded-xl shadow-md border-2 border-red-200 p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-red-900 mb-1">
                  Error Loading Messages
                </h3>
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={fetchMessages}
                  className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-3"></div>
              <p className="text-slate-600 font-medium">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 p-12 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {activeTab === "sent" ? (
                <Send className="w-10 h-10 text-slate-400" />
              ) : (
                <Mail className="w-10 h-10 text-slate-400" />
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {activeTab === "sent"
                ? "No Sent Messages"
                : "No Received Messages"}
            </h3>
            <p className="text-slate-500 text-sm">
              {activeTab === "sent"
                ? "Messages you send for approval will appear here"
                : "Admin notifications and received messages will appear here"}
            </p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 p-12 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <InboxIcon className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              No {statusFilter !== "all" ? `${statusFilter} ` : ""}Messages
            </h3>
            <p className="text-slate-500 text-sm">
              No messages match the selected status filter.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-[1.55fr_0.95fr]">
            <div className="space-y-3">
              {filteredMessages.map((msg) => {
                const statusConfig = getStatusConfig(msg.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <div
                    key={msg._id}
                    onClick={() => setSelectedMessage(msg)}
                    className="bg-white rounded-lg shadow-md border-2 border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-md ${
                              activeTab === "received" && msg.isAdminScheduled
                                ? "bg-linear-to-br from-purple-500 to-purple-600"
                                : "bg-linear-to-br from-blue-500 to-indigo-600"
                            }`}
                          >
                            {activeTab === "received" &&
                            msg.isAdminScheduled ? (
                              <Calendar className="w-4 h-4 text-white" />
                            ) : (
                              <Mail className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="font-bold text-slate-900 text-base leading-tight truncate">
                                {msg.subject}
                              </h3>
                              {activeTab === "received" &&
                                msg.isAdminScheduled && (
                                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-bold whitespace-nowrap">
                                    Admin Event
                                  </span>
                                )}
                            </div>
                            <div className="grid grid-cols-1 gap-1 text-[12px] text-slate-500 sm:grid-cols-2">
                              <p className="truncate">
                                To:{" "}
                                <span className="font-semibold text-slate-700">
                                  {getDisplayName(msg.recipient, "Admin")}
                                </span>
                              </p>
                              <p className="truncate">
                                From:{" "}
                                <span className="font-semibold text-slate-700">
                                  {getDisplayName(msg.sender)}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold border ${statusConfig.color}`}
                        >
                          <StatusIcon
                            size={14}
                            className={
                              statusConfig.animate
                                ? "animate-spin inline-block"
                                : ""
                            }
                          />
                          {statusConfig.label}
                        </span>
                      </div>

                      <div className="mb-3 p-4 bg-slate-50 rounded-3xl border border-slate-200">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap wrap-break-word line-clamp-4">
                          {msg.body}
                        </p>
                      </div>

                      {msg.status === "rejected" && msg.rejectionReason && (
                        <div className="mb-3 p-3 bg-red-50 rounded-lg border border-red-200">
                          <p className="text-xs text-red-700 whitespace-pre-wrap wrap-break-word">
                            <strong>Reason:</strong> {msg.rejectionReason}
                          </p>
                        </div>
                      )}

                      {(() => {
                        const msgAttachments = getAttachments(msg);
                        return msgAttachments.length > 0 ? (
                          <div className="mb-3 p-2.5 bg-blue-50 rounded-lg border-2 border-blue-200">
                            <div className="space-y-2">
                              {msgAttachments.map((att, i) => (
                                <div
                                  key={`att-${i}`}
                                  className="flex items-center gap-1.5"
                                >
                                  <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                                  {att.url ? (
                                    <a
                                      href={`${window.BACKEND_URL}${att.url}`}
                                      download
                                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline truncate"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {att.name}
                                    </a>
                                  ) : (
                                    <span className="text-xs font-semibold text-blue-600 truncate">
                                      {att.name}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null;
                      })()}

                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-[12px] text-slate-500">
                          <Calendar size={12} />
                          <span className="font-medium">
                            {new Date(msg.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                            {" • "}
                            {new Date(msg.createdAt).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {activeTab === "sent" && msg.status === "pending" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmAndUpdateMessageStatus(
                                  msg._id,
                                  "cancelled",
                                );
                              }}
                              className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-full text-[11px] font-semibold border border-red-200 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                          {activeTab === "sent" &&
                            msg.status === "cancelled" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateMessageStatus(msg._id, "pending");
                                }}
                                className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-full text-[11px] font-semibold border border-amber-200 transition-colors"
                              >
                                Resend
                              </button>
                            )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMessage(msg);
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-[11px] font-semibold border border-slate-200 transition-colors"
                          >
                            View details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <aside className="hidden xl:block">
              <div className="sticky top-6 space-y-4">
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-500 uppercase tracking-[0.2em]">
                        Inbox summary
                      </p>
                      <h2 className="text-xl font-bold text-slate-900 mt-2">
                        {selectedMessage
                          ? "Selected message"
                          : "Choose a message"}
                      </h2>
                    </div>
                    <button
                      onClick={() => fetchMessages()}
                      disabled={loading}
                      className="h-10 w-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition"
                      title="Refresh messages"
                    >
                      <RefreshCw
                        size={18}
                        className={loading ? "animate-spin" : ""}
                      />
                    </button>
                  </div>

                  <div className="grid gap-3">
                    <div className="rounded-3xl bg-slate-50 p-4 border border-slate-200">
                      <p className="text-xs font-semibold uppercase text-slate-500 tracking-[0.2em]">
                        Total
                      </p>
                      <p className="mt-2 text-3xl font-bold text-slate-900">
                        {stats.total}
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-3xl bg-blue-50 p-4 border border-blue-100">
                        <p className="text-xs font-semibold uppercase text-blue-600 tracking-[0.2em]">
                          Pending
                        </p>
                        <p className="mt-2 text-xl font-bold text-blue-800">
                          {stats.pending}
                        </p>
                      </div>
                      <div className="rounded-3xl bg-emerald-50 p-4 border border-emerald-100">
                        <p className="text-xs font-semibold uppercase text-emerald-600 tracking-[0.2em]">
                          Approved
                        </p>
                        <p className="mt-2 text-xl font-bold text-emerald-800">
                          {stats.approved}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-md font-semibold text-slate-900">
                      Details
                    </h3>
                    {selectedMessage && (
                      <button
                        onClick={() => setSelectedMessage(null)}
                        className="text-sm text-slate-500 hover:text-slate-700"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {selectedMessage ? (
                    <div className="space-y-4 text-sm text-slate-700">
                      <p>
                        <span className="block text-slate-500">Subject</span>
                        <span className="font-semibold">
                          {selectedMessage.subject}
                        </span>
                      </p>
                      <p>
                        <span className="block text-slate-500">From</span>
                        <span className="font-semibold">
                          {getDisplayName(selectedMessage.sender)}
                        </span>
                      </p>
                      <p>
                        <span className="block text-slate-500">To</span>
                        <span className="font-semibold">
                          {getDisplayName(selectedMessage.recipient, "Admin")}
                        </span>
                      </p>
                      <p>
                        <span className="block text-slate-500">Status</span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[12px] text-slate-700">
                          {getStatusConfig(selectedMessage.status).label}
                        </span>
                      </p>
                      <p>
                        <span className="block text-slate-500">Created</span>
                        <span className="font-semibold">
                          {new Date(selectedMessage.createdAt).toLocaleString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-3xl bg-slate-50 p-4 border border-slate-200 text-slate-500">
                      Select a message to view details, attachments, and
                      actions.
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* Message Details Modal */}
        {selectedMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 lg:hidden">
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-blue-50">
                <h2 className="text-lg font-bold">Message Details</h2>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto flex-1">
                <p className="text-sm text-slate-600">
                  <strong>Subject:</strong> {selectedMessage.subject}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ==================== STAT CARD COMPONENT ==================== */
const StatCard = ({ icon: Icon, title, value, color }) => {
  const colors = {
    blue: {
      bg: "from-blue-500 to-blue-600",
      text: "text-blue-600",
    },
    amber: {
      bg: "from-amber-500 to-amber-600",
      text: "text-amber-600",
    },
    emerald: {
      bg: "from-emerald-500 to-emerald-600",
      text: "text-emerald-600",
    },
    red: {
      bg: "from-red-500 to-red-600",
      text: "text-red-600",
    },
    purple: {
      bg: "from-purple-500 to-purple-600",
      text: "text-purple-600",
    },
  };

  const c = colors[color];

  return (
    <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 p-4 hover:shadow-lg transition-all">
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-11 h-11 bg-linear-to-br ${c.bg} rounded-lg flex items-center justify-center shadow-md`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <h3 className="text-xs font-semibold text-slate-500 mb-0.5">{title}</h3>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
};

export default Inbox;
