import React, { useState, useEffect } from "react";
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
} from "lucide-react";

/* ===================== CONSTANTS ===================== */
const API_BASE = "http://localhost:5000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/* ===================== MAIN COMPONENT ===================== */
const Inbox = () => {
  /* ==================== STATE ==================== */
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ==================== DATA FETCHING ==================== */
  useEffect(() => {
    fetchSentMessages();
  }, []);

  const fetchSentMessages = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please log in again.");
        setLoading(false);
        return;
      }

      const res = await axios.get(`${API_BASE}/messages/sent`, {
        headers: getAuthHeaders(),
      });

      setMessages(res.data.messages || []);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load messages. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  /* ==================== HELPER FUNCTIONS ==================== */
  const getStatusConfig = (status) => {
    const configs = {
      approved: {
        color:
          "from-emerald-100 to-emerald-50 text-emerald-700 border-emerald-200",
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
      completed: {
        color: "from-purple-100 to-purple-50 text-purple-700 border-purple-200",
        icon: CheckCircle,
        label: "Completed",
      },
    };

    return (
      configs[status] || {
        color: "from-slate-100 to-slate-50 text-slate-700 border-slate-200",
        icon: AlertCircle,
        label: "Unknown",
      }
    );
  };

  /* ==================== STATISTICS ==================== */
  const stats = {
    total: messages.length,
    pending: messages.filter((m) => m.status === "pending").length,
    approved: messages.filter((m) => m.status === "approved").length,
    rejected: messages.filter((m) => m.status === "rejected").length,
  };

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
                Sent Messages
              </h1>
              <p className="text-slate-600 mt-1 text-xs sm:text-sm">
                Track your submitted messages and approval status
              </p>
            </div>
            <button
              onClick={fetchSentMessages}
              disabled={loading}
              className="px-3 sm:px-4 py-2 bg-white hover:bg-slate-50 border-2 border-slate-200 rounded-lg font-semibold text-xs sm:text-sm text-slate-700 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 whitespace-nowrap"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
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
                  onClick={fetchSentMessages}
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
              <Mail className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              No Messages Yet
            </h3>
            <p className="text-slate-500 text-sm">
              Messages you send for approval will appear here
            </p>
          </div>
        ) : (
          /* Messages List */
          <div className="space-y-3">
            {messages.map((msg) => {
              const statusConfig = getStatusConfig(msg.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={msg._id}
                  className="bg-white rounded-lg shadow-md border-2 border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                          <Mail className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 text-base leading-tight mb-0.5">
                            {msg.subject}
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            To:{" "}
                            <span className="font-semibold text-slate-700">
                              {msg.recipient?.username || "Admin"}
                            </span>
                          </p>
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
                    {(msg.isAttached && msg.attachmentUrl) ||
                    msg.attachmentName ? (
                      <div className="mb-3 p-2.5 bg-blue-50 rounded-lg border-2 border-blue-200">
                        <div className="flex items-center gap-1.5">
                          <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                          <a
                            href={`http://localhost:5000${msg.attachmentUrl}`}
                            download
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline truncate"
                          >
                            {msg.attachmentName || "Download attachment"}
                          </a>
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
                    </div>
                  </div>
                </div>
              );
            })}
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
