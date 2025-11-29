import React from "react";

const Sidebar = () => {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    user = null;
  }

  const role = user?.role || "Guest";

  // Admin sidebar
  if (role === "Admin") {
    return (
      <div className="flex">
        <div className="w-64 h-screen bg-gray-900 text-white p-5 flex flex-col gap-6">
          <h1 className="text-2xl font-bold tracking-wide">Admin Panel</h1>

          <nav className="flex flex-col gap-3">
            <a
              href="/dashboard"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition"
            >
              <span>📊</span>
              <span>Dashboard</span>
            </a>

            <a
              href="/barangay-storage"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition"
            >
              <span>🏘️</span>
              <span>Barangays</span>
            </a>

            <a
              href="/admin/youth-profiles"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition"
            >
              <span>🧑‍🤝‍🧑</span>
              <span>Youth Profiles</span>
            </a>

            <a
              href="/admin/events"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition"
            >
              <span>📅</span>
              <span>Event Scheduling</span>
            </a>

            <a
              href="/admin/monitoring"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition"
            >
              <span>📊</span>
              <span>Monitoring & Evaluation</span>
            </a>

            <a
              href="/admin/reports"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition"
            >
              <span>📑</span>
              <span>Reports</span>
            </a>
            <a
              href="/profile"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition"
            >
              <span>👤</span>
              <span>Profile</span>
            </a>
            <a
              href="/admin/settings"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition"
            >
              <span>⚙️</span>
              <span>Settings</span>
            </a>
          </nav>
        </div>
      </div>
    );
  }

  // SK Official sidebar
  if (role === "Official") {
    return (
      <div className="flex">
        <div className="w-64 h-screen bg-gray-900 text-white p-5 flex flex-col gap-6">
          <h1 className="text-2xl font-bold tracking-wide">SKOfficial Panel</h1>

          <nav className="flex flex-col gap-3">
            <a
              href="/official-dashboard"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition"
            >
              <span>✉️</span>
              <span>Compose</span>
            </a>

            <a
              href="/dashboard"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition"
            >
              <span>📥</span>
              <span>Inbox</span>
            </a>

            <a
              href="/sent"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition"
            >
              <span>📤</span>
              <span>Sent</span>
            </a>

            <a
              href="/calendar"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition"
            >
              <span>📅</span>
              <span>Event Scheduling</span>
            </a>

            <a
              href="/barangay-storage"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition"
            >
              <span>🏘️</span>
              <span>Barangays</span>
            </a>

            <a
              href="/profile"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition"
            >
              <span>👤</span>
              <span>Profile</span>
            </a>
          </nav>
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

          <nav className="flex flex-col gap-3">
            <a
              href="/official-dashboard"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition"
            >
              <span>✉️</span>
              <span>Compose</span>
            </a>

            <a
              href="/dashboard"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition"
            >
              <span>📥</span>
              <span>Inbox</span>
            </a>

            <a
              href="/sent"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition"
            >
              <span>📤</span>
              <span>Sent</span>
            </a>

            <a
              href="/calendar"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition"
            >
              <span>📅</span>
              <span>Event Scheduling</span>
            </a>

            <a
              href="/barangay-storage"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition"
            >
              <span>🏘️</span>
              <span>Barangays</span>
            </a>

            <a
              href="/profile"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition"
            >
              <span>👤</span>
              <span>Profile</span>
            </a>
          </nav>
        </div>
      </div>
    );
  }

  // Default / guest sidebar
  return (
    <div className="flex">
      <div className="w-64 h-screen bg-gray-900 text-white p-5 flex flex-col gap-6">
        <h1 className="text-2xl font-bold tracking-wide">SKhub</h1>
        <nav className="flex flex-col gap-3">
          <a href="/" className="p-2 rounded-lg hover:bg-gray-700 transition">
            Home
          </a>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
