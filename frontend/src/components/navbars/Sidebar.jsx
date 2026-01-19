import React from "react";
import SideProfile from "../SideProfile";
import {
  CalendarDays,
  Home,
  LayoutDashboard,
  Users,
  UserRound,
  CalendarClock,
  Settings,
  BarChart2,
  FileText,
  Inbox,
  Send,
  MailPlus,
} from "lucide-react";

const Sidebar = () => {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
    console.log(user);
  } catch {}

  const role = user?.role || "Guest";

  /* ================== ADMIN SIDEBAR ================== */
  if (role === "Admin") {
    return (
      <div className="flex">
        <div className="bg-white text-black p-5 flex flex-col left-0 top-14 h-[calc(100vh-4rem)] w-55 shadow-md">
          <h1 className="text-2xl font-bold tracking-wide mb-4">Admin Panel</h1>

          <nav className="flex flex-col gap-2">
            <a
              href="/dashboard"
              className="menu-item flex items-center gap-3 py-3 px-2 rounded hover:bg-blue-300"
            >
              <LayoutDashboard size={20} /> Dashboard
            </a>

            <a
              href="/barangay-storage"
              className="menu-item flex items-center gap-3 py-3 px-2 rounded hover:bg-blue-300"
            >
              <Home size={20} /> Barangays
            </a>

            <a
              href="/sk-official"
              className="menu-item flex items-center gap-3 py-3 px-2 rounded hover:bg-blue-300"
            >
              <Users size={20} /> Youth Profiles
            </a>

            <a
              href="/admin/events"
              className="menu-item flex items-center gap-3 py-3 px-2 rounded hover:bg-blue-300"
            >
              <CalendarDays size={20} /> Event Scheduling
            </a>

            <a
              href="/admin/monitoring"
              className="menu-item flex items-center gap-3 py-3 px-2 rounded hover:bg-blue-300"
            >
              <BarChart2 size={20} /> Monitoring & Evaluation
            </a>

            <a
              href="/admin/reports"
              className="menu-item flex items-center gap-3 py-3 px-2 rounded hover:bg-blue-300"
            >
              <FileText size={20} /> Reports
            </a>

            <a
              href="/admin/settings"
              className="menu-item flex items-center gap-3 py-3 px-2 rounded hover:bg-blue-300"
            >
              <Settings size={20} /> Settings
            </a>
          </nav>

          <div className="mt-auto">
            <SideProfile user={user} />
          </div>
        </div>
      </div>
    );
  }
  if (role === "Official") {
    return (
      <div className="flex">
        <div className="bg-white text-black p-5 flex flex-col left-0 top-14 h-[calc(100vh-4rem)] w-64 shadow-md">
          <h1 className="text-2xl font-bold tracking-wide mb-4">
            Officials Panel
          </h1>

          <nav className="flex flex-col gap-2">
            <a
              href="/official-dashboard"
              className="menu-item flex items-center gap-3 py-3 px-2 rounded hover:bg-blue-300"
            >
              <MailPlus size={20} /> Compose
            </a>

            <a
              href="/dashboard"
              className="menu-item flex items-center gap-3 py-3 px-2 rounded hover:bg-blue-300"
            >
              <Inbox size={20} /> Inbox
            </a>

            <a
              href="/sent"
              className="menu-item flex items-center gap-3 py-3 px-2 rounded hover:bg-blue-300"
            >
              <Send size={20} /> Sent
            </a>

            <a
              href="/event-calendar"
              className="menu-item flex items-center gap-3 py-3 px-2 rounded hover:bg-blue-300"
            >
              <CalendarClock size={20} /> Event Calendar
            </a>

            <a
              href="/barangay-storage"
              className="menu-item flex items-center gap-3 py-3 px-2 rounded hover:bg-blue-300"
            >
              <Home size={20} /> Barangays
            </a>
          </nav>

          <div className="mt-auto">
            <SideProfile user={user} />
          </div>
        </div>
      </div>
    );
  }

  if (role === "") {
    return (
      <div className="flex">
        <div className="w-64 h-screen bg-gray-900 text-white p-5 flex flex-col gap-6 shadow-lg">
          <h1 className="text-2xl font-bold tracking-wide">Youth Member</h1>

          <nav className="flex flex-col gap-4">
            <a
              href="/official-dashboard"
              className="menu-item flex items-center gap-3 py-3 px-2 rounded hover:bg-blue-300"
            >
              <MailPlus size={20} /> Compose
            </a>

            <a
              href="/dashboard"
              className="menu-item flex items-center gap-3 py-3 px-2 rounded hover:bg-gray-800"
            >
              <Inbox size={20} /> Inbox
            </a>

            <a
              href="/sent"
              className="menu-item flex items-center gap-3 py-3 px-2 rounded hover:bg-gray-800"
            >
              <Send size={20} /> Sent
            </a>

            <a
              href="/calendar"
              className="menu-item flex items-center gap-3 py-3 px-2 rounded hover:bg-gray-800"
            >
              <CalendarClock size={20} /> Event Scheduling
            </a>

            <a
              href="/barangay-storage"
              className="menu-item flex items-center gap-3 py-3 px-2 rounded hover:bg-gray-800"
            >
              <Home size={20} /> Barangays
            </a>
          </nav>
          <div className="mt-auto">
            <SideProfile user={user} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <div className="w-64 h-screen bg-gray-900 text-white p-5 flex flex-col gap-6 shadow-lg">
        <h1 className="text-2xl font-bold tracking-wide">SKhub</h1>

        <nav className="flex flex-col gap-4">
          <a
            href="/"
            className="menu-item flex items-center gap-3 py-3 px-2 rounded hover:bg-gray-800"
          >
            <Home size={20} /> Home
          </a>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
