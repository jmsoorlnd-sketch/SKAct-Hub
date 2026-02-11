import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../../layout/Layout";
import { useNavigate } from "react-router-dom";
import { Clock, CheckCircle, FileText } from "lucide-react";

const AdminNotification = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");

        // 1) Pending messages for admin (inbox) - used as approvals notifications
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

        // 2) Barangay storages: gather recent ongoing and completed items
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
                  subtitle: s.documentName || s.document?.subject || "Project",
                  time: s.createdAt || s.updatedAt,
                  meta: { barangayId: b._id, storageId: s._id },
                  icon: "ongoing",
                }));

              const completed = storage
                .filter((s) => (s.document?.status || s.status) === "completed")
                .sort((a, c) => new Date(c.createdAt) - new Date(a.createdAt))
                .slice(0, 2)
                .map((s) => ({
                  type: "barangay_completed",
                  id: s._id,
                  title: `Completed in ${b.barangayName || b.barangay}`,
                  subtitle: s.documentName || s.document?.subject || "Project",
                  time: s.createdAt || s.updatedAt,
                  meta: { barangayId: b._id, storageId: s._id },
                  icon: "completed",
                }));

              storageNotifs.push(...ongoing, ...completed);
            } catch (err) {
              // ignore per-barangay errors
            }
          }),
        );

        // 3) Activities (calendar) - upcoming or almost due
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

        const all = [...pendingNotifs, ...storageNotifs, ...upcoming];
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
              // ignore
            }
          }),
        );
        const merged = [...all, ...updatesNotifs];
        // sort by time desc (recent first)
        merged.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
        setNotifications(merged);
      } catch (error) {
        console.error("Failed to load notifications:", error);
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
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Notifications</h1>
        <p className="text-sm text-gray-500 mb-6">
          Recent activities and alerts. Click any notification to go to the
          related page.
        </p>

        {loading ? (
          <div className="text-gray-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="text-gray-500">No recent notifications</div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                className="p-4 bg-white rounded-lg shadow hover:shadow-md cursor-pointer flex justify-between items-start"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      {n.icon === "activity" ? (
                        <Clock className="text-gray-600" />
                      ) : n.icon === "message" ? (
                        <FileText className="text-gray-600" />
                      ) : (
                        <CheckCircle className="text-gray-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">{n.title}</p>
                      <p className="text-xs text-gray-500">{n.subtitle}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-400">
                  <div>{new Date(n.time).toLocaleString()}</div>
                  {n.note && <div className="text-emerald-600">{n.note}</div>}
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
