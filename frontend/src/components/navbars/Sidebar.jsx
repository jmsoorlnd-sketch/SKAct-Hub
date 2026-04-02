import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation, Link } from "react-router-dom";
import axios from "axios";
import { useSocket } from "../../context/SocketContext"; // Adjust path
import SideProfile from "./SideProfile";
import {
  Archive,
  CalendarDays,
  Home,
  Bell,
  Users,
  CalendarClock,
  Settings,
  BarChart2,
  Inbox,
  Clock,
  Database,
  Download,
  Shield,
} from "lucide-react";

/* ===================== CONSTANTS ===================== */
const API_BASE = "http://localhost:5000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/* ===================== MAIN COMPONENT ===================== */
const Sidebar = ({ onClose = () => {} }) => {
  /* ==================== STATE ==================== */
  const [user, setUser] = useState(null);
  const [unseenCount, setUnseenCount] = useState(0);
  const location = useLocation();
  const currentPath = location.pathname;
  const { socket, isConnected } = useSocket();

  /* ==================== FETCH UNSEEN COUNT ==================== */
  const fetchUnseenCount = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Get seen statuses
      const seenStatusResponse = await axios.get(
        `${API_BASE}/notifications/status`,
        { headers: getAuthHeaders() },
      );
      const seenMap = seenStatusResponse.data.seenStatuses || {};

      const allNotifs = [];

      /* ================== 1. PENDING MESSAGES ================== */
      try {
        const res = await axios.get(`${API_BASE}/messages/inbox`, {
          headers: getAuthHeaders(),
        });
        const inbox = res.data.messages || [];

        inbox
          .filter((m) => m.status === "pending")
          .forEach((m) => allNotifs.push({ id: m._id }));
      } catch {}

      /* ================== 2. BARANGAY ================== */
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
            } catch {}
          }),
        );
      } catch {}

      /* ================== 3. ACTIVITIES ================== */
      try {
        const res = await axios.get(`${API_BASE}/messages/activities`, {
          headers: getAuthHeaders(),
        });
        const activities = res.data?.activities || [];
        const now = Date.now();

        // Upcoming
        activities
          .filter((a) => a.startDate)
          .map((a) => {
            const timeLeft = new Date(a.startDate).getTime() - now;
            return { a, timeLeft };
          })
          .filter(({ timeLeft }) => timeLeft > 0)
          .sort((x, y) => new Date(x.a.startDate) - new Date(y.a.startDate))
          .slice(0, 10)
          .forEach(({ a }) => allNotifs.push({ id: a._id }));

        // Updates
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
            } catch {}
          }),
        );
      } catch {}

      /* ================== COUNT ================== */
      const unseen = allNotifs.filter((n) => !seenMap[n.id]).length;
      setUnseenCount(unseen);
    } catch (err) {
      console.error("Failed to fetch unseen count:", err);
    }
  }, []);

  /* ==================== SOCKET EVENT HANDLERS ==================== */
  const handleNewNotification = useCallback(() => {
    console.log("New notification received, refreshing count...");
    fetchUnseenCount();
  }, [fetchUnseenCount]);

  const handleStatusUpdate = useCallback(() => {
    console.log("Notification status updated, refreshing count...");
    fetchUnseenCount();
  }, [fetchUnseenCount]);

  const handleAllSeen = useCallback(() => {
    console.log("All notifications marked as seen");
    setUnseenCount(0);
  }, []);

  /* ==================== USER & NOTIFICATIONS ==================== */
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

      // Refresh count every 30 seconds as fallback
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

  /* ==================== MENU CONFIGURATION ==================== */
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
        { name: "Youth Profiles", icon: Users, path: "/admin/sk-officials" },
        { name: "SK Personnel", icon: Users, path: "/admin/sk-personnel" },
        { name: "Event Scheduling", icon: CalendarDays, path: "/admin/events" },
        {
          name: "Monitoring & Evaluation",
          icon: BarChart2,
          path: "/admin/monitoring",
        },
        { name: "User Logs", icon: Clock, path: "/admin/user-logs" },
        { name: "Archive", icon: Archive, path: "/admin/archive" },
        {
          name: "Reports & Export",
          icon: Download,
          path: "/admin/settings#reports",
        },
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
        { name: "Settings", icon: Settings, path: "/official/settings" },
      ],
      Guest: [{ name: "Home", icon: Home, path: "/" }],
    };

    return menus[role] || menus.Guest;
  }, [role, unseenCount]);

  /* ==================== RENDER HELPERS ==================== */
  const getMenuClass = (path) => {
    const isActive = currentPath === path;
    return `relative flex items-center gap-2 px-2.5 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
      isActive
        ? "bg-blue-600 text-white shadow-md"
        : "text-slate-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700"
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

  /* ==================== RENDER ====================== */
  return (
    <div className="w-full h-full bg-white shadow-xl flex flex-col">
      {/* Header */}
      <div className="py-2.5 px-4 border-b-2 border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
        <h1 className="text-base font-bold text-slate-900">
          {getPanelTitle()}
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {menuItems.map((menu) => {
          const Icon = menu.icon;
          return (
            <Link
              key={menu.path}
              to={menu.path}
              onClick={onClose}
              className={getMenuClass(menu.path)}
            >
              <Icon size={15} className="flex-shrink-0" />
              <span className="flex-1">{menu.name}</span>

              {/* Notification Badge */}
              {menu.badge && menu.badge > 0 && (
                <span className="px-1.5 py-0.5 bg-red-500 text-white text-[8px] font-bold rounded-full min-w-[16px] text-center flex-shrink-0">
                  {menu.badge > 99 ? "99+" : menu.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Profile Footer */}
      <div className="pb-5 p-3 border-t-2 border-slate-200 bg-blue-50">
        <SideProfile user={user} />
      </div>
    </div>
  );
};

export default React.memo(Sidebar);
