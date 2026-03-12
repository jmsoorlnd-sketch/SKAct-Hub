import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/navbars/Navbar";
import Sidebar from "../components/navbars/Sidebar";

/**
 * Layout Component - Optimized for React Router & Mobile Responsive
 *
 * Uses Outlet for nested routes to prevent remounting
 * Uses flexbox instead of fixed positioning to prevent flickering
 * Sidebar collapses on mobile with toggle functionality
 */
const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen  bg-slate-50">
      {/* ===== NAVBAR ===== */}
      <header className="flex-shrink-0 h-14 bg-white shadow-sm border-b border-slate-200 z-50">
        <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      </header>

      {/* ===== MAIN CONTENT WRAPPER ===== */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* ===== SIDEBAR - MOBILE BACKDROP ===== */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ===== SIDEBAR ===== */}
        {/* Hidden on mobile, visible on md+ */}
        <aside
          className={`absolute md:relative flex w-55 h-full overflow-hidden border-r-2 border-slate-200 bg-white transition-all duration-300 z-40 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </aside>

        {/* ===== PAGE CONTENT ===== */}
        {/* Outlet renders the matched child route */}
        <main className="flex-1 h-full overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
