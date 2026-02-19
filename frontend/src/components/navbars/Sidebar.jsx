import React, { useEffect, useState } from "react";
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
const Sidebar = () => {
  /* ==================== STATE ==================== */
  const [user, setUser] = useState(null);
  const [unseenCount, setUnseenCount] = useState(0);
  const location = useLocation();
  const currentPath = location.pathname;

  /* ==================== USER & NOTIFICATIONS ==================== */
  useEffect(() => {
    loadUser();
    fetchUnseenCount();

    // Refresh count every 30 seconds
    const interval = setInterval(fetchUnseenCount, 30000);
    return () => clearInterval(interval);
  }, []);

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
      const seenIds = getSeenNotifications();

      // Fetch all notifications (same logic as AdminNotification)
      const allNotifs = [];
      const token = localStorage.getItem("token");
      if (!token) return;

      // 1) Pending messages
      try {
        const res = await axios.get(`${API_BASE}/messages/inbox`, {
          headers: getAuthHeaders(),
        });
        const inbox = res.data.messages || [];
        inbox
          .filter((m) => m.status === "pending")
          .forEach((m) => allNotifs.push(m._id));
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
                .forEach((s) => allNotifs.push(s._id));

              storage
                .filter((s) => (s.document?.status || s.status) === "completed")
                .slice(0, 2)
                .forEach((s) => allNotifs.push(s._id));
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
          .forEach((a) => allNotifs.push(a._id));

        await Promise.all(
          activities.map(async (a) => {
            try {
              const updatesRes = await axios.get(
                `${API_BASE}/messages/${a._id}/activity-updates`,
                { headers: getAuthHeaders() },
              );
              const updates = updatesRes.data.updates || [];
              if (updates.length > 0) {
                allNotifs.push(updates[0]._id);
              }
            } catch {}
          }),
        );
      } catch {}

      // Count unseen
      const unseen = allNotifs.filter((id) => !seenIds.includes(id)).length;
      setUnseenCount(unseen);
    } catch (err) {
      console.error("Failed to fetch unseen count:", err);
    }
  };

  const getSeenNotifications = () => {
    try {
      const seen = localStorage.getItem("seenNotifications");
      return seen ? JSON.parse(seen) : [];
    } catch {
      return [];
    }
  };

  /* ==================== MENU CONFIGURATION ==================== */
  const role = user?.role || "Guest";

  const menus = {
    Admin: [
      {
        name: "Notifications",
        icon: Bell,
        path: "/admin/notifications",
        badge: unseenCount,
      },
      { name: "Barangays", icon: Home, path: "/barangay-storage" },
      { name: "Youth Profiles", icon: Users, path: "/sk-official" },
      { name: "SK Personnel", icon: Users, path: "/admin/sk-personnel" },
      { name: "Event Scheduling", icon: CalendarDays, path: "/admin/events" },
      {
        name: "Monitoring & Evaluation",
        icon: BarChart2,
        path: "/admin/monitoring",
      },
      { name: "Settings", icon: Settings, path: "/admin/settings" },
    ],
    Official: [
      { name: "Inbox", icon: Inbox, path: "/inbox" },
      { name: "Event Calendar", icon: CalendarClock, path: "/event-calendar" },
      { name: "Barangays", icon: Home, path: "/barangay-storage" },
      { name: "SK Personnel", icon: Users, path: "/sk-personnel" },
    ],
    Guest: [{ name: "Home", icon: Home, path: "/" }],
  };

  const menuItems = menus[role] || menus.Guest;

  /* ==================== RENDER HELPERS ==================== */
  const getMenuClass = (path) => {
    const isActive = currentPath === path;
    return `relative flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
      isActive
        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
        : "text-slate-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700"
    }`;
  };

  const getPanelTitle = () => {
    switch (role) {
      case "Admin":
        return "Admin Panel";
      case "Official":
        return "Officials Panel";
      default:
        return "SKhub";
    }
  };

  /* ==================== RENDER ==================== */
  return (
    <div className="flex h-full bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="w-64 bg-white shadow-xl flex flex-col border-r-2 border-slate-200">
        {/* Header */}
        <div className="p-6 border-b-2 border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {getPanelTitle()}
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 ">
          {menuItems.map((menu) => {
            const Icon = menu.icon;
            return (
              <Link
                key={menu.path}
                to={menu.path}
                className={getMenuClass(menu.path)}
              >
                <Icon size={20} />
                <span className="flex-1">{menu.name}</span>

                {/* Notification Badge */}
                {menu.badge && menu.badge > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] text-center animate-pulse">
                    {menu.badge > 99 ? "99+" : menu.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Profile Footer */}
        <div className="p-4 border-t-2 border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50">
          <SideProfile user={user} />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
