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
      <div className="flex fixed">
        <div className="w-64 h-screen bg-gray-900 text-white p-5 flex flex-col gap-6">
          <h1 className="text-2xl font-bold tracking-wide">Admin Panel</h1>

          <nav className="flex flex-col gap-3">
            <a href="/dashboard" className="menu-item">
              <span>Dashboard</span>
            </a>

            <a href="/barangay-page" className="menu-item">
              <span>Barangays</span>
            </a>
            <a href="/sk-official" className="menu-item">
              <span>Sk Official</span>
            </a>

            <a href="/admin/events" className="menu-item">
              <span>Event Scheduling</span>
            </a>

            <a href="/admin/monitoring" className="menu-item">
              <span>Monitoring & Evaluation</span>
            </a>

            <a href="/admin/reports" className="menu-item">
              <span>Reports</span>
            </a>

            <a href="/profile" className="menu-item">
              <span>Profile</span>
            </a>

            <a href="/admin/settings" className="menu-item">
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
      <div className="flex fixed">
        <div className="w-64 h-screen bg-gray-900 text-white p-5 flex flex-col gap-6">
          <h1 className="text-2xl font-bold tracking-wide">SKOfficial Panel</h1>

          <nav className="flex flex-col gap-3">
            <a href="/official-dashboard" className="menu-item">
              <span>✉️</span>
              <span>Compose</span>
            </a>

            <a href="/dashboard" className="menu-item">
              <span>📥</span>
              <span>Inbox</span>
            </a>

            <a href="/sent" className="menu-item">
              <span>📤</span>
              <span>Sent</span>
            </a>

            <a href="/calendar" className="menu-item">
              <span>📅</span>
              <span>Event Scheduling</span>
            </a>

            <a href="/barangay-storage" className="menu-item">
              <span>🏘️</span>
              <span>Barangays</span>
            </a>

            <a href="/profile" className="menu-item">
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

        <nav className="flex flex-col gap-3">
          <a href="/" className="menu-item">
            Home
          </a>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
