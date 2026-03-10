import React, { useEffect, useState, useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import axios from "axios";
import SideProfile from "../SideProfile";
import {
  CalendarDays,
  Home,
  Bell,
  Users,
  CalendarClock,
  Settings,
  BarChart2,
  Inbox,
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

  /* ==================== USER & NOTIFICATIONS ==================== */
  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUnseenCount();

      // Refresh count every 10 seconds for real-time updates
      const interval = setInterval(fetchUnseenCount, 10000);
      return () => clearInterval(interval);
    }
  }, [user?.role]);

  // Listen for custom event when notification is marked as seen
  useEffect(() => {
    const handleNotificationUpdate = () => {
      console.log("Notification update event received, refreshing count...");
      fetchUnseenCount();
    };

    window.addEventListener(
      "notificationMarkedAsSeen",
      handleNotificationUpdate,
    );
    window.addEventListener(
      "allNotificationsMarkedAsSeen",
      handleNotificationUpdate,
    );

    return () => {
      window.removeEventListener(
        "notificationMarkedAsSeen",
        handleNotificationUpdate,
      );
      window.removeEventListener(
        "allNotificationsMarkedAsSeen",
        handleNotificationUpdate,
      );
    };
  }, [user]);

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

  const fetchUnseenCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      console.log("Fetching unseen notification count...");

      // Get seen statuses from backend
      const seenStatusResponse = await axios.get(
        `${API_BASE}/notifications/status`,
        { headers: getAuthHeaders() },
      );
      const seenMap = seenStatusResponse.data.seenStatuses || {};

      // Fetch all notifications
      const allNotifs = [];

      // 1) Pending messages
      try {
        const res = await axios.get(`${API_BASE}/messages/inbox`, {
          headers: getAuthHeaders(),
        });
        const inbox = res.data.messages || [];
        inbox
          .filter((m) => m.status === "pending")
          .forEach((m) => allNotifs.push({ id: m._id }));
      } catch {}

      // 2) Barangay storage updates
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

              storage
                .filter((s) => (s.document?.status || s.status) === "ongoing")
                .slice(0, 2)
                .forEach((s) => allNotifs.push({ id: s._id }));

              storage
                .filter((s) => (s.document?.status || s.status) === "completed")
                .slice(0, 2)
                .forEach((s) => allNotifs.push({ id: s._id }));
            } catch {}
          }),
        );
      } catch {}

      // 3) Activities
      try {
        const res = await axios.get(`${API_BASE}/messages/activities`, {
          headers: getAuthHeaders(),
        });
        const activities = res.data.activities || [];

        activities
          .filter((a) => a.startDate)
          .slice(0, 10)
          .forEach((a) => allNotifs.push({ id: a._id }));

        await Promise.all(
          activities.map(async (a) => {
            try {
              const updatesRes = await axios.get(
                `${API_BASE}/messages/${a._id}/activity-updates`,
                { headers: getAuthHeaders() },
              );
              const updates = updatesRes.data.updates || [];
              if (updates.length > 0) {
                allNotifs.push({ id: updates[0]._id });
              }
            } catch {}
          }),
        );
      } catch {}

      // Count unseen (those not in seenMap or marked as false)
      const unseen = allNotifs.filter((n) => !seenMap[n.id]).length;

      console.log(`Unseen count: ${unseen} out of ${allNotifs.length} total`);
      setUnseenCount(unseen);
    } catch (err) {
      console.error("Failed to fetch unseen count:", err);
    }
  };

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
      ],
      Official: [
        { name: "Inbox", icon: Inbox, path: "/official/inbox" },
        {
          name: "Event Calendar",
          icon: CalendarClock,
          path: "/event-calendar",
        },
        { name: "Barangays", icon: Home, path: "/barangay-storage" },
        { name: "SK Personnel", icon: Users, path: "/sk-personnel" },
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
      <div className="p-2 border-t-2 border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 flex-shrink-0">
        <SideProfile user={user} />
      </div>
    </div>
  );
};

export default React.memo(Sidebar);
