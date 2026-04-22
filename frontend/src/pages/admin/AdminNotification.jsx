import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../../context/SocketContext";
import {
  Clock,
  CheckCircle,
  FileText,
  AlertCircle,
  Bell,
  ImageIcon,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

/* ===================== CONSTANTS ===================== */
const API_BASE = "http://localhost:5000/api";

/* ===================== MAIN COMPONENT ===================== */
const AdminNotification = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const tokenRef = useRef(localStorage.getItem("token"));
  const { socket, isConnected } = useSocket();

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  /* ===================== FETCH FUNCTIONS ===================== */
  const fetchPendingMessages = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/messages/inbox`, {
        headers: getAuthHeaders(),
      });
      const inbox = res.data.messages || [];
      const result = inbox
        .filter((m) => m.status === "pending")
        .map((m) => ({
          type: "message_pending",
          id: m._id,
          title: `Pending approval: ${m.subject || "(No subject)"}`,
          subtitle: `From: ${(m.sender?.username || m.sender?.firstname || "Unknown").trim()}`,
          time: m.createdAt,
          meta: { messageId: m._id },
          icon: "message",
        }));
      console.log(
        "[DEBUG] fetchPendingMessages returning:",
        result.map((r) => ({ id: r.id, title: r.title, subtitle: r.subtitle })),
      );
      return result;
    } catch (err) {
      console.error("Failed to fetch pending messages:", err);
      return [];
    }
  }, [getAuthHeaders]);

  const fetchBarangayUpdates = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/barangays/all-barangays`, {
        headers: getAuthHeaders(),
      });
      const barangays = res.data.barangays || [];

      const allBarangayNotifs = await Promise.all(
        barangays.map(async (b) => {
          try {
            const storageRes = await axios.get(
              `${API_BASE}/barangays/${b._id}/storage`,
              { headers: getAuthHeaders() },
            );
            const storage = storageRes.data.storage || [];

            const formatNotif = (s, type) => ({
              type,
              id: s._id,
              title: `${type === "barangay_ongoing" ? "Ongoing" : "Completed"}: ${(b.barangayName || b.barangay || "Barangay").trim()}`,
              subtitle:
                (s.documentName || s.document?.subject || "Project").trim() ||
                "(Untitled)",
              time: s.createdAt || s.updatedAt,
              meta: { barangayId: b._id },
              icon: type === "barangay_ongoing" ? "ongoing" : "completed",
            });

            const ongoing = storage
              .filter((s) => (s.document?.status || s.status) === "ongoing")
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 2)
              .map((s) => formatNotif(s, "barangay_ongoing"));

            const completed = storage
              .filter((s) => (s.document?.status || s.status) === "completed")
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 2)
              .map((s) => formatNotif(s, "barangay_completed"));

            return [...ongoing, ...completed];
          } catch (err) {
            console.error(`Failed to fetch storage for ${b._id}:`, err);
            return [];
          }
        }),
      );

      const result = allBarangayNotifs.flat();
      console.log(
        "[DEBUG] fetchBarangayUpdates returning:",
        result.map((r) => ({ id: r.id, title: r.title, subtitle: r.subtitle })),
      );
      return result;
    } catch (err) {
      console.error("Failed to fetch barangays:", err);
      return [];
    }
  }, [getAuthHeaders]);

  const fetchActivities = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/messages/activities`, {
        headers: getAuthHeaders(),
      });
      const activities = res.data.activities || [];
      const now = Date.now();

      // Upcoming activities
      const upcoming = activities
        .filter((a) => a.startDate)
        .map((a) => {
          const start = new Date(a.startDate).getTime();
          const timeLeft = start - now;
          return { a, timeLeft };
        })
        .filter(({ timeLeft }) => timeLeft > 0)
        .sort((x, y) => new Date(x.a.startDate) - new Date(y.a.startDate))
        .slice(0, 10)
        .map(({ a, timeLeft }) => ({
          type: "activity",
          id: a._id,
          title: `${a.subject || "(Untitled activity)"}`,
          subtitle: `By: ${(a.sender?.username || "Admin").trim()}`,
          time: a.startDate,
          meta: { activityId: a._id },
          note: timeLeft < 86400000 ? "Within 24 hours" : "Upcoming",
          icon: "activity",
        }));

      // Activity updates
      const updatesPromises = activities.map(async (a) => {
        try {
          const updatesRes = await axios.get(
            `${API_BASE}/messages/${a._id}/activity-updates`,
            { headers: getAuthHeaders() },
          );
          const updates = updatesRes.data.updates || [];
          if (updates.length === 0) return [];
          const latest = updates[0];
          return {
            type: "activity_update",
            id: latest._id,
            title: `New update: ${a.subject || "(Untitled)"}`,
            subtitle:
              `${(latest.uploadedBy?.firstname || "Unknown").trim()} ${(latest.uploadedBy?.lastname || "").trim()}`.trim() ||
              "(No name)",
            time: latest.createdAt,
            meta: { documentId: a._id },
            note: latest.caption || "",
            icon: "activity_update",
          };
        } catch (err) {
          console.error(`Failed to fetch updates for ${a._id}:`, err);
          return [];
        }
      });

      const updatesNotifications = (await Promise.all(updatesPromises)).flat();
      const result = [...upcoming, ...updatesNotifications];
      console.log(
        "[DEBUG] fetchActivities returning:",
        result.map((r) => ({ id: r.id, title: r.title, subtitle: r.subtitle })),
      );
      return result;
    } catch (err) {
      console.error("Failed to fetch activities:", err);
      return [];
    }
  }, [getAuthHeaders]);

  const fetchSavedNotifications = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/notifications`, {
        headers: getAuthHeaders(),
      });
      const rawNotifications = res.data.notifications || [];
      console.log(
        "[DEBUG] Raw notifications fetched from API:",
        rawNotifications,
      );

      const validNotifications = rawNotifications.filter((n) => {
        const hasType =
          n && typeof n.type === "string" && n.type.trim().length > 0;
        const hasTitle =
          typeof n.title === "string" && n.title.trim().length > 0;
        const hasSubtitle =
          typeof n.subtitle === "string" && n.subtitle.trim().length > 0;
        const isValid = hasType && hasTitle && hasSubtitle;
        if (!isValid) {
          console.log(
            "[DEBUG] Saved notification failed validation - hasType:",
            hasType,
            "hasTitle:",
            hasTitle,
            "hasSubtitle:",
            hasSubtitle,
            "Full:",
            n,
          );
        }
        return isValid;
      });
      console.log(
        "[DEBUG] Valid saved notifications after filtering:",
        validNotifications.map((v) => ({
          id: v.id,
          title: v.title,
          subtitle: v.subtitle,
        })),
      );

      return validNotifications.map((notification) => ({
        ...notification,
        icon: notification.type,
        time: notification.time || notification.createdAt || null,
      }));
    } catch (err) {
      console.error("Failed to fetch saved notifications:", err);
      return [];
    }
  }, [getAuthHeaders]);

  const loadNotifications = useCallback(async () => {
    if (!tokenRef.current) return setError("No auth token");
    setLoading(true);
    setError(null);

    try {
      const [messages, barangays, activities, savedNotifications] =
        await Promise.all([
          fetchPendingMessages(),
          fetchBarangayUpdates(),
          fetchActivities(),
          fetchSavedNotifications(),
        ]);

      console.log("[DEBUG] All notification sources loaded:", {
        messages: messages.length,
        barangays: barangays.length,
        activities: activities.length,
        savedNotifications: savedNotifications.length,
      });

      // Load seen statuses
      const res = await axios.get(`${API_BASE}/notifications/status`, {
        headers: getAuthHeaders(),
      });
      const seenMap = res.data.seenStatuses || {};

      const allNotifications = [
        ...messages,
        ...barangays,
        ...activities,
        ...savedNotifications,
      ];

      console.log(
        "[DEBUG] All notifications before deduplication:",
        allNotifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
        })),
      );

      const uniqueNotifications = Array.from(
        allNotifications
          .reduce((map, notification) => {
            if (notification?.id && !map.has(notification.id)) {
              map.set(notification.id, notification);
            }
            return map;
          }, new Map())
          .values(),
      );

      console.log(
        "[DEBUG] Unique notifications after deduplication:",
        uniqueNotifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
        })),
      );

      const filteredNotifications = uniqueNotifications.filter((n) => {
        const hasType =
          n && typeof n.type === "string" && n.type.trim().length > 0;
        const hasTitle =
          typeof n.title === "string" && n.title.trim().length > 0;
        const hasSubtitle =
          typeof n.subtitle === "string" && n.subtitle.trim().length > 0;
        const isValid = hasType && hasTitle && hasSubtitle;

        if (!isValid) {
          console.log(
            "[DEBUG] FILTERED OUT - hasType:",
            hasType,
            "| hasTitle:",
            hasTitle,
            "| hasSubtitle:",
            hasSubtitle,
            "| Full:",
            n,
          );
        }
        return isValid;
      });

      console.log(
        "[DEBUG] Notifications after final validation:",
        filteredNotifications.length,
      );
      console.log(
        "[DEBUG] Final notifications to display:",
        filteredNotifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
        })),
      );

      const notificationsToSet = filteredNotifications
        .map((n) => ({
          ...n,
          seen: seenMap[n.id] || false,
        }))
        .sort(
          (a, b) =>
            new Date(b.time || b.createdAt) - new Date(a.time || a.createdAt),
        );

      console.log(
        "[DEBUG] ABOUT TO SET STATE with notifications:",
        notificationsToSet.length,
        notificationsToSet,
      );
      setNotifications(notificationsToSet);
    } catch (err) {
      console.error(err);
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [
    fetchPendingMessages,
    fetchBarangayUpdates,
    fetchActivities,
    fetchSavedNotifications,
    getAuthHeaders,
  ]);

  /* ===================== SOCKET EVENT HANDLERS ===================== */
  const handleNewNotification = useCallback(
    (notification) => {
      console.log("🔔 New notification received via socket:", notification);
      // Immediately refresh all notifications
      loadNotifications();

      // Optional: Show browser notification
      if (Notification.permission === "granted") {
        new Notification("New Notification", {
          body: notification.title || "You have a new notification",
          icon: "/favicon.ico",
        });
      }
    },
    [loadNotifications],
  );

  const handleStatusUpdate = useCallback(({ notificationId, seen }) => {
    console.log("📢 Notification status updated:", notificationId, seen);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, seen } : n)),
    );
  }, []);

  const handleAllSeen = useCallback(() => {
    console.log("✅ All notifications marked as seen");
    setNotifications((prev) => prev.map((n) => ({ ...n, seen: true })));
  }, []);

  /* ===================== INITIAL LOAD & SOCKET SETUP ===================== */
  useEffect(() => {
    loadNotifications();

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Polling fallback: refresh every 30 seconds if socket is not connected
    const interval = setInterval(() => {
      if (!isConnected) {
        console.log("⚠️ Socket not connected, polling for updates...");
        loadNotifications();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loadNotifications, isConnected]);

  useEffect(() => {
    if (socket && isConnected) {
      console.log("✅ Setting up socket listeners for notifications...");

      // Listen for socket events
      socket.on("new-notification", handleNewNotification);
      socket.on("notification-status-updated", handleStatusUpdate);
      socket.on("all-notifications-seen", handleAllSeen);

      // Cleanup
      return () => {
        console.log("🧹 Cleaning up socket listeners...");
        socket.off("new-notification", handleNewNotification);
        socket.off("notification-status-updated", handleStatusUpdate);
        socket.off("all-notifications-seen", handleAllSeen);
      };
    } else {
      console.log("⚠️ Socket not available or not connected:", {
        socket: !!socket,
        isConnected,
      });
    }
  }, [
    socket,
    isConnected,
    handleNewNotification,
    handleStatusUpdate,
    handleAllSeen,
  ]);

  /* ==================== SEEN/UNSEEN ==================== */
  const markAsSeen = async (notificationId) => {
    try {
      if (!tokenRef.current) return;
      await axios.put(
        `${API_BASE}/notifications/${notificationId}/seen`,
        {},
        { headers: getAuthHeaders() },
      );
      // Socket will handle the UI update
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsSeen = async () => {
    try {
      if (!tokenRef.current) return;
      await axios.put(
        `${API_BASE}/notifications/all/seen`,
        {},
        { headers: getAuthHeaders() },
      );
      // Socket will handle the UI update
    } catch (err) {
      console.error(err);
    }
  };

  /* ==================== NAVIGATION ==================== */
  const handleClick = async (notification) => {
    await markAsSeen(notification.id);

    switch (notification.type) {
      case "message_pending":
        navigate("/admin/dashboard", {
          state: { messageId: notification.meta.messageId },
        });
        break;
      case "barangay_ongoing":
      case "barangay_completed":
        navigate(`/barangay-view/${notification.meta.barangayId}`);
        break;
      case "activity":
        navigate("/admin/events");
        break;
      case "activity_update":
        navigate("/admin/monitoring", {
          state: { messageId: notification.meta.documentId },
        });
        break;
      case "report_submitted":
        navigate("/admin/reports");
        break;
      default:
        navigate("/admin/monitoring");
    }
  };

  const unseenCount = notifications.filter((n) => !n.seen).length;

  const getNotificationIcon = (iconType) => {
    const configs = {
      message_pending: {
        icon: FileText,
        color: "from-orange-500 to-orange-600",
      },
      message_approved: {
        icon: CheckCircle,
        color: "from-emerald-500 to-emerald-600",
      },
      message_rejected: { icon: AlertCircle, color: "from-red-500 to-red-600" },
      message_updated: { icon: Bell, color: "from-slate-500 to-slate-600" },
      report_submitted: {
        icon: FileText,
        color: "from-amber-500 to-amber-600",
      },
      activity: { icon: Clock, color: "from-purple-500 to-purple-600" },
      activity_update: {
        icon: ImageIcon,
        color: "from-emerald-500 to-emerald-600",
      },
      barangay_ongoing: { icon: Clock, color: "from-amber-500 to-amber-600" },
      barangay_completed: {
        icon: CheckCircle,
        color: "from-blue-500 to-blue-600",
      },
    };
    return (
      configs[iconType] || { icon: Bell, color: "from-slate-500 to-slate-600" }
    );
  };

  const getNotificationLabel = (type) => {
    switch (type) {
      case "message_pending":
        return "Document Pending";
      case "message_approved":
        return "Document Approved";
      case "message_rejected":
        return "Document Rejected";
      case "message_updated":
        return "Document Updated";
      case "report_submitted":
        return "Report Submitted";
      case "activity":
        return "Upcoming Activity";
      case "activity_update":
        return "Activity Update";
      case "barangay_ongoing":
        return "Ongoing Barangay";
      case "barangay_completed":
        return "Completed Barangay";
      default:
        return "Notification";
    }
  };

  /* ==================== RENDER ==================== */
  console.log("[DEBUG] RENDER called with notifications state:", notifications);
  return (
    <div className="min-h-screen bg-blue-50">
      <div className="max-w-7xl mx-auto px-2 md:px-6 py-2 md:py-4">
        {/* Connection Status */}
        {!isConnected && (
          <div className="mb-1 md:mb-3 bg-yellow-100 border border-yellow-400 text-yellow-700 px-2 py-1 md:px-4 md:py-1.5 rounded-lg text-[10px] md:text-sm flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Connecting to real-time updates...</span>
          </div>
        )}

        {isConnected && (
          <div className="mb-1 md:mb-3 bg-green-100 border border-green-400 text-green-700 px-2 py-1 md:px-4 md:py-1.5 rounded-lg text-[10px] md:text-sm">
            ✅ Connected to real-time updates
          </div>
        )}

        {/* Page Header */}
        <div className="mb-2 md:mb-3">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-2 gap-1 md:gap-3">
            <div>
              <h1 className="text-lg md:text-2xl font-bold">Notifications</h1>
              <p className="text-slate-600 mt-0 md:mt-1 text-[10px] md:text-sm">
                Stay updated with recent activities
              </p>
            </div>

            {unseenCount > 0 && (
              <button
                onClick={markAllAsSeen}
                className="w-full md:w-auto px-2 md:px-3 py-1 md:py-1.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold text-xs md:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center md:justify-start gap-1"
              >
                <Eye size={14} />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-1.5 md:gap-6">
            <div className="bg-white rounded-lg shadow-md border border-slate-200 p-1.5 md:p-4 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between gap-1 md:gap-4">
                <div>
                  <p className="text-slate-500 text-[8px] md:text-sm font-semibold mb-0">
                    Total
                  </p>
                  <p className="text-base md:text-3xl font-bold text-slate-900">
                    {notifications.length}
                  </p>
                </div>
                <div className="w-7 h-7 md:w-12 md:h-12 bg-linear-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                  <Bell className="w-3 md:w-5 h-3 md:h-5 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md border border-slate-200 p-1.5 md:p-4 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between gap-1 md:gap-4">
                <div>
                  <p className="text-slate-500 text-[8px] md:text-sm font-semibold mb-0">
                    Unread
                  </p>
                  <p className="text-base md:text-3xl font-bold text-slate-900">
                    {unseenCount}
                  </p>
                </div>
                <div className="w-7 h-7 md:w-12 md:h-12 bg-linear-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                  <EyeOff className="w-3 md:w-5 h-3 md:h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex items-center justify-center py-4 md:py-10">
            <div className="text-center">
              <Loader2 className="w-6 md:w-10 h-6 md:h-10 text-blue-600 animate-spin mx-auto mb-1" />
              <p className="text-slate-600 text-xs md:text-sm font-medium">
                Loading...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-lg shadow-sm border border-red-200 p-2 md:p-4">
            <div className="flex items-start gap-1.5">
              <div className="w-6 md:w-9 h-6 md:h-9 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                <AlertCircle className="w-3 md:w-4 h-3 md:h-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-xs md:text-sm font-bold text-red-900 mb-0.5">
                  Error
                </h3>
                <p className="text-xs text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md border border-slate-200 p-2 md:p-5 text-center">
            <div className="w-8 md:w-12 h-8 md:h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-1 md:mb-3">
              <CheckCircle className="w-4 md:w-6 h-4 md:h-6 text-slate-400" />
            </div>
            <p className="text-sm md:text-lg font-bold text-slate-900 mb-0.5">
              All caught up!
            </p>
            <p className="text-slate-500 text-xs md:text-sm">
              No notifications at the moment.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 md:space-y-3">
            {notifications.map((n) => {
              console.log("[DEBUG] Rendering notification:", n);
              const { icon: Icon, color } = getNotificationIcon(n.icon);

              return (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`relative bg-white rounded-lg shadow-md border transition-all cursor-pointer hover:shadow-xl hover:-translate-y-0.5 ${
                    n.seen
                      ? "border-slate-200"
                      : "border-blue-300 bg-blue-50/50"
                  }`}
                >
                  <div className="p-2 md:p-3 flex items-start gap-2 md:gap-3">
                    <div
                      className={`w-7 md:w-10 h-7 md:h-10 bg-linear-to-br ${color} rounded-2xl flex items-center justify-center shadow-sm shrink-0`}
                    >
                      <Icon className="w-3 md:w-4 h-3 md:h-4 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1 md:gap-2 mb-0.5 md:mb-1">
                        <div>
                          <span className="inline-flex rounded-full bg-slate-100 px-1.5 py-0 md:px-3 md:py-1 text-[7px] md:text-[11px] font-semibold text-slate-700">
                            {getNotificationLabel(n.type)}
                          </span>
                          <h3 className="mt-0.5 md:mt-2 font-semibold text-slate-900 text-xs md:text-base leading-tight">
                            {n.title || getNotificationLabel(n.type)}
                          </h3>
                        </div>
                        {!n.seen && (
                          <div className="w-2.5 h-2.5 bg-red-500 rounded-full mt-1 animate-pulse shrink-0" />
                        )}
                      </div>

                      <p className="text-[10px] md:text-sm text-slate-600 mb-0.5 md:mb-1">
                        {n.subtitle || "No additional details"}
                      </p>

                      <div className="flex flex-wrap items-center gap-1 md:gap-2 text-[10px] text-slate-500">
                        <div className="flex items-center gap-0.5">
                          <Clock size={10} className="md:w-3 md:h-3" />
                          <span className="font-medium text-[9px] md:text-xs">
                            {(() => {
                              const rawTime = n.time || n.createdAt;
                              if (!rawTime) return "No date";
                              const parsed = new Date(rawTime);
                              return Number.isNaN(parsed.getTime())
                                ? "No date"
                                : parsed.toLocaleString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  });
                            })()}
                          </span>
                        </div>

                        {n.note && (
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[9px] md:text-xs font-semibold ${
                              n.note.includes("24")
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {n.note}
                          </span>
                        )}
                      </div>
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

export default AdminNotification;
