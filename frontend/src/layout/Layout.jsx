import React from "react";
import Navbar from "../components/navbars/Navbar";
import Footer from "../components/Footer";
import Sidebar from "../components/navbars/Sidebar";

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Top Bar (Always full width above sidebar) */}
      <div className="z-20">
        <Navbar />
      </div>

      {/* Main Content Area (Sidebar under navbar) */}
      <div className="flex flex-1">
        {/* Sidebar (under navbar, fixed height, scrollable) */}
        <div className="w-64 bg-gray-900 text-white">
          <Sidebar />
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      <Footer />
    </div>
  );
};

export default Layout;
