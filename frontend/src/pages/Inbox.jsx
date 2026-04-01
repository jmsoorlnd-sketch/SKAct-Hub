import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
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
const API_BASE = "http://localhost:5000/api";

/* ===================== STATUS CONFIG (STATIC - NO RECREATION) ===================== */
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

/* ===================== MAIN COMPONENT ===================== */
const Inbox = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sentMessages, setSentMessages] = useState([]);
  const [receivedMessages, setReceivedMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ===================== MEMO ===================== */
  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  /* ===================== FETCH ===================== */
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

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  /* ===================== AUTO-REFRESH FOR ADMIN APPROVALS ===================== */
  useEffect(() => {
    // Poll for message updates every 10 seconds
    const pollInterval = setInterval(() => {
      fetchMessages();
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [fetchMessages]);

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

  const filteredMessages = useMemo(() => {
    if (statusFilter === "all") return messages;
    return messages.filter((m) => m.status === statusFilter);
  }, [messages, statusFilter]);

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

  const handleUpdateMessageStatus = async (messageId, status) => {
    if (!messageId) return;
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE}/messages/${messageId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      fetchMessages();
    } catch (err) {
      console.error("Failed to update message status:", err);
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

    await handleUpdateMessageStatus(messageId, status);
  };

  /* ===================== HELPERS ===================== */
  const getStatusConfig = useCallback(
    (status) => STATUS_CONFIG[status] || DEFAULT_STATUS,
    [],
  );

  const getDisplayName = useCallback((user, fallback = "Unknown") => {
    if (!user) return fallback;

    const fullName =
      user.firstname || user.lastname
        ? `${user.firstname || ""} ${user.lastname || ""}`.trim()
        : "";

    // Prefer the actual human name first, then username/email
    return fullName || user.username || user.email || fallback;
  }, []);

  /* ==================== RENDER ==================== */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        {/* Page Header */}
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3">
                <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
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

          {/* Statistics Cards */}
          {/* Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-sm font-semibold text-slate-600">
              Filter:
            </span>
            {statusToggleOptions.map((option) => (
              <button
                key={option}
                onClick={() => setStatusFilter(option)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  statusFilter === option
                    ? "bg-blue-500 text-white border-blue-600"
                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                }`}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
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
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
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
          /* Empty State */
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
          /* Filter Empty State */
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
          /* Messages List */
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
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md ${
                            activeTab === "received" && msg.isAdminScheduled
                              ? "bg-gradient-to-br from-purple-500 to-purple-600"
                              : "bg-gradient-to-br from-blue-500 to-indigo-600"
                          }`}
                        >
                          {activeTab === "received" && msg.isAdminScheduled ? (
                            <Calendar className="w-4 h-4 text-white" />
                          ) : (
                            <Mail className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-bold text-slate-900 text-base leading-tight">
                              {msg.subject}
                            </h3>
                            {activeTab === "received" &&
                              msg.isAdminScheduled && (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-bold whitespace-nowrap">
                                  Admin Event
                                </span>
                              )}
                          </div>
                          <div className="space-y-0.5 text-[11px] text-slate-500">
                            <p>
                              To:{" "}
                              <span className="font-semibold text-slate-700">
                                {getDisplayName(msg.recipient, "Admin")}
                              </span>
                            </p>
                            <p>
                              From:{" "}
                              <span className="font-semibold text-slate-700">
                                {getDisplayName(msg.sender)}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold border-2 bg-gradient-to-r ${statusConfig.color} flex-shrink-0`}
                      >
                        <StatusIcon
                          size={12}
                          className={
                            statusConfig.animate
                              ? "animate-spin inline-block"
                              : ""
                          }
                        />
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* Message Body */}
                    <div className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-xs text-slate-700 whitespace-pre-wrap break-words line-clamp-3">
                        {msg.body}
                      </p>
                    </div>
                    {/* Rejection reason if message was rejected */}
                    {msg.status === "rejected" && msg.rejectionReason && (
                      <div className="mb-3 p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-xs text-red-700 whitespace-pre-wrap break-words">
                          <strong>Reason:</strong> {msg.rejectionReason}
                        </p>
                      </div>
                    )}

                    {/* Attachment */}
                    {msg.attachmentUrls?.length > 0 ||
                    msg.attachmentUrl ||
                    msg.attachmentName ? (
                      <div className="mb-3 p-2.5 bg-blue-50 rounded-lg border-2 border-blue-200">
                        <div className="space-y-2">
                          {(msg.attachmentUrls?.length > 0
                            ? msg.attachmentUrls.map((url, index) => ({
                                url,
                                name:
                                  msg.attachmentNames?.[index] ||
                                  `Attachment ${index + 1}`,
                              }))
                            : msg.attachmentUrl
                              ? [
                                  {
                                    url: msg.attachmentUrl,
                                    name: msg.attachmentName || "Attachment",
                                  },
                                ]
                              : [
                                  {
                                    url: null,
                                    name: msg.attachmentName || "Attachment",
                                  },
                                ]
                          ).map((att, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                              {att.url ? (
                                <a
                                  href={`http://localhost:5000${att.url}`}
                                  download
                                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline truncate"
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
                    ) : null}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Calendar size={11} />
                        <span className="font-medium">
                          {new Date(msg.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {/* Status Indicator */}
                      {msg.status === "approved" && (
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
                          <CheckCircle size={11} />
                          Approved
                        </span>
                      )}
                      {msg.status === "rejected" && (
                        <span className="text-[11px] font-bold text-red-600 flex items-center gap-0.5">
                          <XCircle size={11} />
                          Rejected
                        </span>
                      )}
                      {msg.status === "pending" && (
                        <span className="text-[11px] font-bold text-amber-600 flex items-center gap-0.5 ">
                          <Clock size={11} />
                          Awaiting Review
                        </span>
                      )}
                      {activeTab === "sent" && msg.status === "pending" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmAndUpdateMessageStatus(msg._id, "cancelled");
                          }}
                          className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-[11px] font-semibold border border-red-200 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                      {activeTab === "sent" && msg.status === "cancelled" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateMessageStatus(msg._id, "pending");
                          }}
                          className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-[11px] font-semibold border border-amber-200 transition-colors"
                        >
                          Resend
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <h2 className="text-lg font-bold">Message Details</h2>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg"
                >
                  Close
                </button>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-sm text-slate-600">
                  <strong>Subject:</strong> {selectedMessage.subject}
                </p>
                <p className="text-sm text-slate-600">
                  <strong>Status:</strong> {selectedMessage.status}
                </p>
                <div className="space-y-1">
                  <p className="text-sm text-slate-600">
                    <strong>To:</strong>{" "}
                    {getDisplayName(selectedMessage.recipient, "Admin")}
                  </p>
                  <p className="text-sm text-slate-600">
                    <strong>From:</strong>{" "}
                    {getDisplayName(selectedMessage.sender)}
                  </p>
                </div>
                <p className="text-sm text-slate-600">
                  <strong>Body:</strong>
                </p>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap">
                  {selectedMessage.body}
                </div>
                {selectedMessage.status === "rejected" &&
                  selectedMessage.rejectionReason && (
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-red-700">
                        <strong>Rejection Reason:</strong>{" "}
                        {selectedMessage.rejectionReason}
                      </p>
                    </div>
                  )}
                {selectedMessage.attachmentUrls?.length > 0 ||
                selectedMessage.attachmentUrl ||
                selectedMessage.attachmentName ? (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    {(selectedMessage.attachmentUrls?.length > 0
                      ? selectedMessage.attachmentUrls.map((url, index) => ({
                          url,
                          name:
                            selectedMessage.attachmentNames?.[index] ||
                            `Attachment ${index + 1}`,
                        }))
                      : selectedMessage.attachmentUrl
                        ? [
                            {
                              url: selectedMessage.attachmentUrl,
                              name:
                                selectedMessage.attachmentName || "Attachment",
                            },
                          ]
                        : [
                            {
                              url: null,
                              name:
                                selectedMessage.attachmentName || "Attachment",
                            },
                          ]
                    ).map((att, index) => (
                      <div key={`attachment-${index}`} className="mb-1">
                        {att.url ? (
                          <a
                            href={`http://localhost:5000${att.url}`}
                            download
                            className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {att.name}
                          </a>
                        ) : (
                          <span className="text-sm font-semibold text-blue-600">
                            {att.name}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
                <p className="text-sm text-slate-500">
                  <strong>Created:</strong>{" "}
                  {new Date(selectedMessage.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
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
          className={`w-11 h-11 bg-gradient-to-br ${c.bg} rounded-lg flex items-center justify-center shadow-md`}
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
