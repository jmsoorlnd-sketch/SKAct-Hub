import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/navbars/Navbar";
import Sidebar from "../components/navbars/Sidebar";

/**
 * Layout Component - Optimized for React Router
 *
 * Uses Outlet for nested routes to prevent remounting
 * Uses flexbox instead of fixed positioning to prevent flickering
 */
const Layout = () => {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      {/* ===== NAVBAR ===== */}
      <header className="flex-shrink-0 h-14 bg-white shadow-sm border-b border-slate-200 z-50">
        <Navbar />
      </header>

      {/* ===== MAIN CONTENT WRAPPER ===== */}
      <div className="flex flex-1 overflow-hidden">
        {/* ===== SIDEBAR ===== */}
        {/* Using flex instead of fixed positioning prevents flickering */}
        <aside className="flex w-55 h-full overflow-hidden border-r-2 border-slate-200 bg-white">
          <Sidebar />
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
