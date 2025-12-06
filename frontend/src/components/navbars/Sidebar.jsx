import React from "react";
import SideProfile from "../SideProfile";

const Sidebar = () => {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {}

  const role = user?.role || "Guest";

  if (role === "Admin") {
    return (
      <div className="flex ">
        <div className=" bg-white text-black p-5 flex flex-col left-0 top-14 h-[calc(100vh-4rem)] ">
          <h1 className="text-2xl font-bold tracking-wide ">Admin Panel</h1>

          {/* MENU */}
          <nav className="flex flex-col gap-2">
            <a
              href="/dashboard"
              className="menu-item flex items-center gap-3 py-3 px-2 rounded hover:bg-blue-300"
            >
              <span>📊</span> Dashboard
            </a>

            <a
              href="/barangay-storage"
              className="menu-item flex items-center gap-3 py-3 px-2 rounded hover:bg-blue-300"
            >
              <span>🏘️</span> Barangays
            </a>

            <a
              href="/sk-official"
              className="menu-item flex items-center gap-3 py-3 px-2 rounded hover:bg-blue-300"
            >
              <span>🧑‍🤝‍🧑</span> Youth Profiles
            </a>

            <a
              href="/admin/events"
              className="menu-item flex items-center gap-3 py-3 px-2 rounded hover:bg-blue-300"
            >
              <span>📅</span> Event Scheduling
            </a>

            <a
              href="/admin/monitoring"
              className="menu-item flex items-center gap-3 py-3 px-2 rounded hover:bg-blue-300"
            >
              <span>📊</span> Monitoring & Evaluation
            </a>

            <a
              href="/admin/reports"
              className="menu-item flex items-center gap-3 py-3 px-2 rounded hover:bg-blue-300"
            >
              <span>📑</span> Reports
            </a>

            <a
              href="/admin/settings"
              className="menu-item flex items-center gap-3 py-3 px-2 rounded hover:bg-blue-300"
            >
              <span>⚙️</span> Settings
            </a>
          </nav>

          {/* PUSH TO BOTTOM */}
          <div className="mt-auto">
            <SideProfile user={user} />
          </div>
        </div>
      </div>
    );
  }

  // Youth sidebar
  if (role === "Youth") {
    return (
      <div className="flex">
        <div className="w-64 h-screen bg-gray-900 text-white p-5 flex flex-col gap-6">
          <h1 className="text-2xl font-bold tracking-wide">Youth Member</h1>

          <nav className="flex flex-col gap-4">
            <a
              href="/official-dashboard"
              className="menu-item flex items-center gap-3 py-3 px-2 rounded hover:bg-blue-800"
            >
              <span>✉️</span>
              <span>Compose</span>
            </a>

            <a
              href="/dashboard"
              className="menu-item flex items-center gap-3 py-3 px-2 rounded hover:bg-gray-800"
            >
              <span>📥</span>
              <span>Inbox</span>
            </a>

            <a
              href="/sent"
              className="menu-item flex items-center gap-3 py-3 px-2 rounded hover:bg-gray-800"
            >
              <span>📤</span>
              <span>Sent</span>
            </a>

            <a
              href="/calendar"
              className="menu-item flex items-center gap-3 py-3 px-2 rounded hover:bg-gray-800"
            >
              <span>📅</span>
              <span>Event Scheduling</span>
            </a>

            <a
              href="/barangay-storage"
              className="menu-item flex items-center gap-3 py-3 px-2 rounded hover:bg-gray-800"
            >
              <span>🏘️</span>
              <span>Barangays</span>
            </a>

            <a
              href="/profile"
              className="menu-item flex items-center gap-3 py-3 px-2 rounded hover:bg-gray-800"
            >
              <span>👤</span>
              <span>Profile</span>
            </a>
          </nav>
        </div>
      </div>
    );
  }

  // Default / Guest
  return (
    <div className="flex">
      <div className="w-64 h-screen bg-gray-900 text-white p-5 flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-wide">SKhub</h1>

        <nav className="flex flex-col gap-4">
          <a
            href="/"
            className="menu-item flex items-center gap-3 py-3 px-2 rounded hover:bg-gray-800"
          >
            Home
          </a>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
