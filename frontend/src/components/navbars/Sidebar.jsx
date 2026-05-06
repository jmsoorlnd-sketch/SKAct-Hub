import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation, Link } from "react-router-dom";
import axios from "axios";
import { useSocket } from "../../context/SocketContext";
import SideProfile from "./SideProfile";
import {
  Archive,
  CalendarDays,
  Home,
  Bell,
  Users,
  CalendarClock,
  Settings,
  Inbox,
  Clock,
  Download,
} from "lucide-react";

const API_BASE = window.API_BASE;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const Sidebar = ({ onClose = () => {} }) => {
  const [user, setUser] = useState(null);
  const [unseenCount, setUnseenCount] = useState(0);
  const location = useLocation();
  const currentPath = location.pathname;
  const { socket, isConnected } = useSocket();

  const fetchUnseenCount = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const seenStatusResponse = await axios.get(
        `${API_BASE}/notifications/status`,
        { headers: getAuthHeaders() },
      );
      const seenMap = seenStatusResponse.data.seenStatuses || {};
      const allNotifs = [];

      try {
        const res = await axios.get(`${API_BASE}/messages/inbox`, {
          headers: getAuthHeaders(),
        });
        const inbox = res.data.messages || [];
        inbox
          .filter((m) => m.status === "pending")
          .forEach((m) => allNotifs.push({ id: m._id }));
      } catch (error) {
        console.debug(error);
      }

      try {
        const res = await axios.get(`${API_BASE}/barangays/all-barangays`, {
          headers: getAuthHeaders(),
        });
        const barangays = res.data.barangays || [];

        await Promise.all(
          barangays.map(async (b) => {
            try {
              const storageRes = await axios.get(
                `${API_BASE}/barangays/${b._id}/storage`,
                { headers: getAuthHeaders() },
              );
              const storage = storageRes.data.storage || [];

              const ongoing = storage
                .filter((s) => (s.document?.status || s.status) === "ongoing")
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 2);

              const completed = storage
                .filter((s) => (s.document?.status || s.status) === "completed")
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 2);

              [...ongoing, ...completed].forEach((s) =>
                allNotifs.push({ id: s._id }),
              );
            } catch (error) {
              console.debug(error);
            }
          }),
        );
      } catch (error) {
        console.debug(error);
      }

      try {
        const res = await axios.get(`${API_BASE}/messages/activities`, {
          headers: getAuthHeaders(),
        });
        const activities = res.data?.activities || [];
        const now = Date.now();

        activities
          .filter((a) => a.startDate)
          .map((a) => ({ a, timeLeft: new Date(a.startDate).getTime() - now }))
          .filter(({ timeLeft }) => timeLeft > 0)
          .sort((x, y) => new Date(x.a.startDate) - new Date(y.a.startDate))
          .slice(0, 10)
          .forEach(({ a }) => allNotifs.push({ id: a._id }));

        await Promise.all(
          activities.map(async (a) => {
            try {
              const updatesRes = await axios.get(
                `${API_BASE}/messages/${a._id}/activity-updates`,
                { headers: getAuthHeaders() },
              );
              const updates = updatesRes.data?.updates || [];
              if (updates.length > 0) {
                allNotifs.push({ id: updates[0]._id });
              }
            } catch (error) {
              console.debug(error);
            }
          }),
        );
      } catch (error) {
        console.debug(error);
      }

      try {
        const res = await axios.get(`${API_BASE}/notifications`, {
          headers: getAuthHeaders(),
        });
        const savedNotifications = res.data.notifications || [];
        const existingIds = new Set(allNotifs.map((n) => n.id));
        savedNotifications.forEach((notif) => {
          if (notif?.id && !existingIds.has(notif.id)) {
            allNotifs.push({ id: notif.id });
            existingIds.add(notif.id);
          }
        });
      } catch (saveErr) {
        console.error(
          "Failed to fetch saved notifications for count:",
          saveErr,
        );
      }

      const unseen = allNotifs.filter((n) => !seenMap[n.id]).length;
      setUnseenCount(unseen);
    } catch (err) {
      console.error("Failed to fetch unseen count:", err);
    }
  }, []);

  const handleNewNotification = useCallback(() => {
    fetchUnseenCount();
  }, [fetchUnseenCount]);

  const handleStatusUpdate = useCallback(() => {
    fetchUnseenCount();
  }, [fetchUnseenCount]);

  const handleAllSeen = useCallback(() => {
    setUnseenCount(0);
  }, []);

  useEffect(() => {
    const loadUser = () => {
      try {
        const userData = localStorage.getItem("user");
        if (userData && userData !== "undefined" && userData !== "null") {
          setUser(JSON.parse(userData));
        }
      } catch (err) {
        console.error("Failed to parse user:", err);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUnseenCount();
      const interval = setInterval(fetchUnseenCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchUnseenCount]);

  useEffect(() => {
    if (socket && isConnected) {
      socket.on("new-notification", handleNewNotification);
      socket.on("notification-status-updated", handleStatusUpdate);
      socket.on("all-notifications-seen", handleAllSeen);
      return () => {
        socket.off("new-notification", handleNewNotification);
        socket.off("notification-status-updated", handleStatusUpdate);
        socket.off("all-notifications-seen", handleAllSeen);
      };
    }
  }, [
    socket,
    isConnected,
    handleNewNotification,
    handleStatusUpdate,
    handleAllSeen,
  ]);

  const role = user?.role || "Guest";

  const menuItems = useMemo(() => {
    const menus = {
      Admin: [
        {
          name: "Notifications",
          icon: Bell,
          path: "/admin/notifications",
          badge: unseenCount,
        },
        { name: "Barangays", icon: Home, path: "/barangay-storage" },
        { name: "Official Profiles", icon: Users, path: "/admin/sk-officials" },
        { name: "SK Personnel", icon: Users, path: "/admin/sk-personnel" },
        { name: "Event Scheduling", icon: CalendarDays, path: "/admin/events" },
        { name: "User Logs", icon: Clock, path: "/admin/user-logs" },
        { name: "Archive", icon: Archive, path: "/admin/archive" },
        { name: "Reports & Export", icon: Download, path: "/admin/reports" },
        { name: "Settings", icon: Settings, path: "/admin/settings" },
      ],
      Official: [
        { name: "Inbox", icon: Inbox, path: "/official/inbox" },
        {
          name: "Event Calendar",
          icon: CalendarClock,
          path: "/event-calendar",
        },
        { name: "Your Barangay", icon: Home, path: "/barangay-storage" },
        { name: "Archive", icon: Archive, path: "/archive" },
        { name: "SK Personnel Status", icon: Users, path: "/sk-personnel" },
        { name: "Submit Reports", icon: Download, path: "/submit-report" },
        { name: "Settings", icon: Settings, path: "/official/settings" },
      ],
      Guest: [{ name: "Home", icon: Home, path: "/" }],
    };
    return menus[role] || menus.Guest;
  }, [role, unseenCount]);

  const getMenuClass = (path) => {
    const isActive = currentPath === path;
    return `relative flex items-center gap-2 px-3 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${
      isActive
        ? "bg-blue-600 text-white shadow-lg"
        : "text-slate-700 hover:bg-slate-100 hover:text-blue-700"
    }`;
  };

  const getPanelTitle = () => {
    switch (role) {
      case "Admin":
        return "Admin";
      case "Official":
        return "Officials";
      default:
        return "SKhub";
    }
  };

  return (
    <div className="w-full h-full bg-white shadow-xl flex flex-col">
      <div className="py-4 px-5 border-b border-slate-200 bg-linear-to-r from-blue-50 to-indigo-50 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              {getPanelTitle()}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Quick access to your tasks
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {user?.role || "Guest"}
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
        {menuItems.map((menu) => {
          const Icon = menu.icon;
          return (
            <Link
              key={menu.path}
              to={menu.path}
              onClick={onClose}
              className={getMenuClass(menu.path)}
            >
              <Icon size={16} className="shrink-0" />
              <span className="flex-1 truncate">{menu.name}</span>
              {menu.badge > 0 && (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  {menu.badge > 99 ? "99+" : menu.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="pb-5 p-4 border-t border-slate-200 bg-slate-50">
        <SideProfile user={user} />
      </div>
    </div>
  );
};

export default React.memo(Sidebar);
