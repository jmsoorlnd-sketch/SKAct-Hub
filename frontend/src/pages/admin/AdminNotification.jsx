import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../../layout/Layout";
import { useNavigate } from "react-router-dom";
import { Clock, CheckCircle, FileText, AlertCircle } from "lucide-react";

const AdminNotification = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("No authorization token found. Please log in again.");
          setLoading(false);
          return;
        }

        let allNotifications = [];

        // 1) Pending messages for admin (inbox) - used as approvals notifications
        try {
          const inboxRes = await axios.get(
            "http://localhost:5000/api/messages/inbox",
            { headers: { Authorization: `Bearer ${token}` } },
          );
          const inbox = inboxRes.data.messages || [];

          const pendingNotifs = (inbox || [])
            .filter((m) => m.status === "pending")
            .map((m) => ({
              type: "message_pending",
              id: m._id,
              title: `Pending approval: ${m.subject}`,
              subtitle: m.sender?.username || "Unknown",
              time: m.createdAt,
              meta: { messageId: m._id },
              icon: "message",
            }));

          allNotifications.push(...pendingNotifs);
        } catch (err) {
          console.error("Failed to fetch pending messages:", err);
          // Continue without pending notifications
        }

        // 2) Barangay storages: gather recent ongoing and completed items
        try {
          const barsRes = await axios.get(
            "http://localhost:5000/api/barangays/all-barangays",
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          const barangays = barsRes.data.barangays || [];

          const storageNotifs = [];
          await Promise.all(
            barangays.map(async (b) => {
              try {
                const r = await axios.get(
                  `http://localhost:5000/api/barangays/${b._id}/storage`,
                  { headers: { Authorization: `Bearer ${token}` } },
                );
                const storage = r.data.storage || [];
                // pick recent 2 ongoing and 2 completed
                const ongoing = storage
                  .filter((s) => (s.document?.status || s.status) === "ongoing")
                  .sort((a, c) => new Date(c.createdAt) - new Date(a.createdAt))
                  .slice(0, 2)
                  .map((s) => ({
                    type: "barangay_ongoing",
                    id: s._id,
                    title: `Ongoing in ${b.barangayName || b.barangay}`,
                    subtitle:
                      s.documentName || s.document?.subject || "Project",
                    time: s.createdAt || s.updatedAt,
                    meta: { barangayId: b._id, storageId: s._id },
                    icon: "ongoing",
                  }));

                const completed = storage
                  .filter(
                    (s) => (s.document?.status || s.status) === "completed",
                  )
                  .sort((a, c) => new Date(c.createdAt) - new Date(a.createdAt))
                  .slice(0, 2)
                  .map((s) => ({
                    type: "barangay_completed",
                    id: s._id,
                    title: `Completed in ${b.barangayName || b.barangay}`,
                    subtitle:
                      s.documentName || s.document?.subject || "Project",
                    time: s.createdAt || s.updatedAt,
                    meta: { barangayId: b._id, storageId: s._id },
                    icon: "completed",
                  }));

                storageNotifs.push(...ongoing, ...completed);
              } catch (err) {
                console.error(
                  `Failed to fetch storage for barangay ${b._id}:`,
                  err,
                );
                // ignore per-barangay errors
              }
            }),
          );

          allNotifications.push(...storageNotifs);
        } catch (err) {
          console.error("Failed to fetch barangays:", err);
          // Continue without barangay notifications
        }

        // 3) Activities (calendar) - upcoming or almost due
        try {
          const activitiesRes = await axios.get(
            "http://localhost:5000/api/messages/activities",
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          const activities = activitiesRes.data.activities || [];
          const now = Date.now();
          const upcoming = activities
            .map((a) => ({ ...a }))
            .filter((a) => a.startDate)
            .map((a) => {
              const start = new Date(a.startDate).getTime();
              const end = a.endDate ? new Date(a.endDate).getTime() : null;
              const timeLeft = start - now;
              return { a, start, end, timeLeft };
            })
            .filter(Boolean)
            .sort((x, y) => x.start - y.start)
            .slice(0, 10)
            .map(({ a, start, end, timeLeft }) => ({
              type: "activity",
              id: a._id,
              title: `${a.subject}`,
              subtitle: a.sender?.username || "",
              time: a.startDate,
              meta: { activityId: a._id },
              note:
                timeLeft <= 0
                  ? "Happening now or past"
                  : timeLeft < 1000 * 60 * 60 * 24
                    ? "Starting within 24 hours"
                    : "Upcoming",
              icon: "activity",
            }));

          allNotifications.push(...upcoming);

          // 4) Activity updates (photos/captions) - fetch recent updates per activity
          const updatesNotifs = [];
          await Promise.all(
            (activities || []).map(async (a) => {
              try {
                const ur = await axios.get(
                  `http://localhost:5000/api/messages/${a._id}/activity-updates`,
                  { headers: { Authorization: `Bearer ${token}` } },
                );
                const ups = ur.data.updates || [];
                if (ups.length > 0) {
                  const latest = ups[0];
                  updatesNotifs.push({
                    type: "activity_update",
                    id: latest._id,
                    title: `Update: ${a.subject}`,
                    subtitle:
                      (latest.uploadedBy?.firstname || "") +
                      " " +
                      (latest.uploadedBy?.lastname || ""),
                    time: latest.createdAt,
                    meta: { documentId: a._id, updateId: latest._id },
                    note: latest.caption || "",
                    icon: "activity_update",
                  });
                }
              } catch (err) {
                console.error(
                  `Failed to fetch updates for activity ${a._id}:`,
                  err,
                );
                // ignore individual activity update errors
              }
            }),
          );

          allNotifications.push(...updatesNotifs);
        } catch (err) {
          console.error("Failed to fetch activities:", err);
          // Continue without activity notifications
        }

        // sort by time desc (recent first)
        allNotifications.sort(
          (a, b) => new Date(b.time || 0) - new Date(a.time || 0),
        );
        setNotifications(allNotifications);
      } catch (error) {
        console.error("Failed to load notifications:", error);
        setError("Failed to load notifications. Please try again.");
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleClick = (n) => {
    // route based on type
    if (n.type === "message_pending") {
      // direct admin to admin dashboard where approvals are managed
      navigate("/admin-dashboard", { state: { messageId: n.meta.messageId } });
    } else if (
      n.type === "barangay_ongoing" ||
      n.type === "barangay_completed"
    ) {
      navigate(`/barangay-view/${n.meta.barangayId}`);
    } else if (n.type === "activity") {
      navigate("/admin/events");
    } else if (n.type === "activity_update") {
      // navigate to monitoring and open activity updates for the document
      navigate("/admin/monitoring", {
        state: { messageId: n.meta.documentId },
      });
    } else {
      navigate("/admin/monitoring");
    }
  };

  return (
    <Layout>
      <div className="w-full p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        {/* ENHANCED HEADER */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Notifications
              </h1>
              <p className="text-gray-600 text-lg">
                Recent activities and alerts. Click any notification to go to
                the related page.
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
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  {notifications.length}
                </p>
                <p className="text-sm text-gray-500">Notifications</p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-6"></div>
              <p className="text-gray-600 text-lg font-medium">
                Loading notifications...
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Please wait while we fetch your updates
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-600 rounded-xl flex items-start gap-4 shadow-lg">
            <AlertCircle className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
            <div>
              <p className="font-bold text-red-900 text-lg">
                Error Loading Notifications
              </p>
              <p className="text-sm text-red-800 mt-1">{error}</p>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border-2 border-dashed border-gray-300 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-800 mb-2">
              No notifications
            </p>
            <p className="text-gray-500 text-lg">
              You're all caught up! Check back later for updates.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className="p-5 bg-white rounded-2xl shadow-md hover:shadow-xl cursor-pointer transition-all duration-300 flex justify-between items-start border border-gray-200 hover:border-blue-300 group hover:translate-y-[-2px]"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 ${
                        n.icon === "activity"
                          ? "bg-gradient-to-br from-purple-100 to-purple-200"
                          : n.icon === "message"
                            ? "bg-gradient-to-br from-orange-100 to-orange-200"
                            : n.icon === "activity_update"
                              ? "bg-gradient-to-br from-green-100 to-emerald-200"
                              : n.icon === "ongoing"
                                ? "bg-gradient-to-br from-yellow-100 to-amber-200"
                                : n.icon === "completed"
                                  ? "bg-gradient-to-br from-blue-100 to-cyan-200"
                                  : "bg-gradient-to-br from-blue-100 to-indigo-200"
                      }`}
                    >
                      {n.icon === "activity" ? (
                        <Clock className="text-purple-600" size={22} />
                      ) : n.icon === "message" ? (
                        <FileText className="text-orange-600" size={22} />
                      ) : n.icon === "activity_update" ? (
                        <CheckCircle className="text-green-600" size={22} />
                      ) : (
                        <CheckCircle className="text-blue-600" size={22} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-lg group-hover:text-blue-700 transition-colors duration-300">
                        {n.title}
                      </p>
                      <p className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors duration-300">
                        {n.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500 ml-4 flex-shrink-0 group-hover:text-gray-700 transition-colors duration-300">
                  <div className="text-xs font-medium">
                    {new Date(n.time).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  {n.note && (
                    <div
                      className={`text-sm font-bold mt-2 px-3 py-1 rounded-full inline-block transition-all duration-300 ${
                        n.note.toLowerCase().includes("happening now")
                          ? "bg-red-100 text-red-700"
                          : n.note.toLowerCase().includes("within 24")
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                      }`}
                    >
                      {n.note}
                    </div>
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

export default AdminNotification;
