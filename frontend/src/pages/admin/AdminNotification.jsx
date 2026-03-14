import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
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
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/* ===================== MAIN COMPONENT ===================== */
const AdminNotification = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const tokenRef = useRef(localStorage.getItem("token"));

  /* ===================== FETCH FUNCTIONS ===================== */
  const fetchPendingMessages = async () => {
    try {
      const res = await axios.get(`${API_BASE}/messages/inbox`, {
        headers: getAuthHeaders(),
      });
      const inbox = res.data.messages || [];
      return inbox
        .filter((m) => m.status === "pending")
        .map((m) => ({
          type: "message_pending",
          id: m._id,
          title: `Pending approval: ${m.subject}`,
          subtitle: `From: ${m.sender?.username || "Unknown"}`,
          time: m.createdAt,
          meta: { messageId: m._id },
          icon: "message",
        }));
    } catch (err) {
      console.error("Failed to fetch pending messages:", err);
      return [];
    }
  };

  const fetchBarangayUpdates = async () => {
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
              title: `${type === "barangay_ongoing" ? "Ongoing" : "Completed"}: ${b.barangayName || b.barangay}`,
              subtitle: s.documentName || s.document?.subject || "Project",
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

      return allBarangayNotifs.flat();
    } catch (err) {
      console.error("Failed to fetch barangays:", err);
      return [];
    }
  };

  const fetchActivities = async () => {
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
          title: a.subject,
          subtitle: `By: ${a.sender?.username || "Admin"}`,
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
            title: `New update: ${a.subject}`,
            subtitle: `${latest.uploadedBy?.firstname || ""} ${latest.uploadedBy?.lastname || ""}`,
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
      return [...upcoming, ...updatesNotifications];
    } catch (err) {
      console.error("Failed to fetch activities:", err);
      return [];
    }
  };

  /* ===================== MAIN FETCH ===================== */
  useEffect(() => {
    const fetchAll = async () => {
      if (!tokenRef.current) return setError("No auth token");
      setLoading(true);
      setError(null);

      try {
        const [messages, barangays, activities] = await Promise.all([
          fetchPendingMessages(),
          fetchBarangayUpdates(),
          fetchActivities(),
        ]);

        // Load seen statuses
        const res = await axios.get(`${API_BASE}/notifications/status`, {
          headers: getAuthHeaders(),
        });
        const seenMap = res.data.seenStatuses || {};

        setNotifications(
          [...messages, ...barangays, ...activities].map((n) => ({
            ...n,
            seen: seenMap[n.id] || false,
          })),
        );
      } catch (err) {
        console.error(err);
        setError("Failed to load notifications");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  /* ==================== SEEN/UNSEEN ==================== */
  const markAsSeen = async (notificationId) => {
    try {
      if (!tokenRef.current) return;
      await axios.put(
        `${API_BASE}/notifications/${notificationId}/seen`,
        {},
        { headers: getAuthHeaders() },
      );
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, seen: true } : n)),
      );
      window.dispatchEvent(new Event("notificationMarkedAsSeen"));
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
      setNotifications((prev) => prev.map((n) => ({ ...n, seen: true })));
      window.dispatchEvent(new Event("allNotificationsMarkedAsSeen"));
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
      default:
        navigate("/admin/monitoring");
    }
  };

  const unseenCount = notifications.filter((n) => !n.seen).length;
  const getNotificationIcon = (iconType) => {
    const configs = {
      activity: { icon: Clock, color: "from-purple-500 to-purple-600" },
      message: { icon: FileText, color: "from-orange-500 to-orange-600" },
      activity_update: {
        icon: ImageIcon,
        color: "from-emerald-500 to-emerald-600",
      },
      ongoing: { icon: Clock, color: "from-amber-500 to-amber-600" },
      completed: { icon: CheckCircle, color: "from-blue-500 to-blue-600" },
    };
    return (
      configs[iconType] || { icon: Bell, color: "from-slate-500 to-slate-600" }
    );
  };
  /* ==================== RENDER ==================== */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Notifications</h1>
              <p className="text-slate-600 mt-1 text-sm">
                Stay updated with recent activities
              </p>
            </div>

            {unseenCount > 0 && (
              <button
                onClick={markAllAsSeen}
                className="px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Eye size={16} />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs font-semibold mb-0.5">
                    Total
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {notifications.length}
                  </p>
                </div>
                <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                  <Bell className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 p-4 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs font-semibold mb-0.5">
                    Unread
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {unseenCount}
                  </p>
                </div>
                <div className="w-11 h-11 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-md">
                  <EyeOff className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Loading...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-md border-2 border-red-200 p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-red-900 mb-1">Error</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border-2 border-slate-200 p-10 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-xl font-bold text-slate-900 mb-1">
              All caught up!
            </p>
            <p className="text-slate-500 text-sm">
              No notifications at the moment.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => {
              const { icon: Icon, color } = getNotificationIcon(n.icon);

              return (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`relative bg-white rounded-xl shadow-md border-2 transition-all cursor-pointer hover:shadow-lg hover:-translate-y-0.5 ${
                    n.seen
                      ? "border-slate-200"
                      : "border-blue-400 bg-blue-50/30"
                  }`}
                >
                  <div className="p-4 flex items-start gap-3">
                    <div
                      className={`w-11 h-11 bg-gradient-to-br ${color} rounded-lg flex items-center justify-center shadow-md flex-shrink-0`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h3 className="font-bold text-slate-900 text-base leading-tight">
                          {n.title}
                        </h3>
                        {!n.seen && (
                          <div className="w-2.5 h-2.5 bg-red-500 rounded-full mt-1 animate-pulse flex-shrink-0" />
                        )}
                      </div>

                      <p className="text-xs text-slate-600 mb-2">
                        {n.subtitle}
                      </p>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Clock size={12} />
                          <span className="font-medium">
                            {new Date(n.time).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {n.note && (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
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
