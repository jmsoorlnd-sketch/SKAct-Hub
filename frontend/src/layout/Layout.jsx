import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/navbars/Navbar";
import Sidebar from "../components/navbars/Sidebar";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      <header className="flex-shrink-0 bg-white shadow-lg border-b border-slate-200 z-50">
        <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/40 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`absolute md:relative flex w-72 h-full overflow-hidden border-r border-slate-200 bg-white transition-transform duration-300 z-40 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </aside>

        <main className="flex-1 h-full overflow-y-auto bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
