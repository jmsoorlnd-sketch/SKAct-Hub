import React from "react";
import Navbar from "../components/navbars/Navbar";
import Sidebar from "../components/navbars/Sidebar";

/**
 * Layout Component
 *
 * Provides the main application structure with:
 * - Fixed navbar at top
 * - Fixed sidebar on left
 * - Scrollable main content area
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Page content to render in main area
 */
const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* ==================== NAVBAR ==================== */}
      {/* Fixed at top, spans full width, z-index ensures it's above content */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-slate-200">
        <Navbar />
      </header>

      {/* ==================== CONTENT WRAPPER ==================== */}
      {/* Flex container for sidebar + main, offset by navbar height (3.5rem = 56px) */}
      <div className="flex flex-1 pt-14">
        {/* ==================== SIDEBAR ==================== */}
        {/* Fixed on left, full height minus navbar, has its own scroll */}
        <aside className="fixed top-14 left-0 w-56 h-[calc(100vh-3.5rem)] bg-white border-r-2 border-slate-200 z-40 overflow-hidden">
          <Sidebar />
        </aside>

        {/* ==================== MAIN CONTENT AREA ==================== */}
        {/* 
          - ml-56 (14rem) matches sidebar width to prevent overlap
          - flex-1 takes remaining horizontal space
          - min-h ensures full viewport height minus navbar
          - overflow-y-auto enables scrolling for long content
        */}
        <main className="ml-56 flex-1 min-h-[calc(100vh-3.5rem)] overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
