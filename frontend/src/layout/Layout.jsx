import React from "react";
import Navbar from "../components/navbars/Navbar";
import Sidebar from "../components/navbars/Sidebar";

const Layout = ({ children }) => {
  return (
    <div className="h-screen flex flex-col">
      {/* Navbar fixed */}
      <header className="fixed top-0 left-0 right-0 z-20">
        <Navbar />
      </header>

      <div className="flex flex-1 pt-16">
        {/* Sidebar fixed */}
        <aside className="  top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-gray-900 text-white">
          <Sidebar />
        </aside>

        {/* Main scrollable */}
        <main className="ml-64 flex-1 bg-gray-200 overflow-hidden p-5 h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
