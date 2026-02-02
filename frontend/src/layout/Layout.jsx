import React from "react";
import Navbar from "../components/navbars/Navbar";
import Sidebar from "../components/navbars/Sidebar";

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col">
      {/* Navbar fixed */}
      <header className="fixed top-0 left-0 right-0 z-20">
        <Navbar />
      </header>

      <div className="flex flex-1 pt-14">
        {/* Sidebar fixed */}
        <aside className="fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] bg-white text-white z-10 overflow-y-auto">
          <Sidebar />
        </aside>

        {/* Main scrollable */}
        <main className="ml-64 flex-1 bg-white p-2 h-[calc(100vh-4rem)] overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
