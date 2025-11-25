import React from "react";

const Sidebar = () => {
  return (
    <div className="flex">
      {/* sidebar */}
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
            href="/admin/barangays"
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition"
          >
            <span>🏘️</span>
            <span>Barangays</span>
          </a>

          <a
            href="/sk-official"
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition"
          >
            <span>🎖️</span>
            <span>SK Officials</span>
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
            href="/admin/program-submissions"
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition"
          >
            <span>📝</span>
            <span>Program Submissions</span>
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
};

export default Sidebar;
