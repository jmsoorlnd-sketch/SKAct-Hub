import React from "react";
import { useLocation, Link } from "react-router-dom";
import SideProfile from "../SideProfile";
import {
  CalendarDays,
  Home,
  LayoutDashboard,
  Users,
  CalendarClock,
  Settings,
  BarChart2,
  MailPlus,
  Inbox,
  Send,
} from "lucide-react";

const Sidebar = () => {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {}

  const role = user?.role || "Guest";
  const location = useLocation();
  const currentPath = location.pathname;

  // Menu Configuration
  const menus = {
    Admin: [
      { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
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
      // { name: "Compose", icon: MailPlus, path: "/official-dashboard" },
      { name: "Inbox", icon: Inbox, path: "/inbox" },
      //{ name: "Sent", icon: Send, path: "/sent" },
      { name: "Event Calendar", icon: CalendarClock, path: "/event-calendar" },
      { name: "Barangays", icon: Home, path: "/barangay-storage" },
      { name: "SK Personnel", icon: Users, path: "/sk-personnel" },
    ],
    Guest: [{ name: "Home", icon: Home, path: "/" }],
  };

  const menuItems = menus[role] || menus.Guest;

  // Helper for active classes
  const getMenuClass = (path) =>
    `flex items-center gap-3 py-2 px-2 rounded transition-colors duration-200 ${
      currentPath === path
        ? "bg-blue-500 text-white"
        : "text-black hover:bg-blue-300"
    }`;

  return (
    <div className="flex">
      <div className="bg-white text-black p-5 flex flex-col left-0 top-14 h-[calc(100vh-4rem)] w-55 shadow-md">
        <h1 className="text-2xl font-bold tracking-wide mb-4">
          {role === "Admin"
            ? "Admin Panel"
            : role === "Official"
              ? "Officials Panel"
              : "SKhub"}
        </h1>

        <nav className="flex flex-col gap-2 text-sm">
          {menuItems.map((menu) => {
            const Icon = menu.icon;
            return (
              <Link
                key={menu.path}
                to={menu.path}
                className={getMenuClass(menu.path)}
              >
                <Icon size={20} /> {menu.name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">
          <SideProfile user={user} />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
