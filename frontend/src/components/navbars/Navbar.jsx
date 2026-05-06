import React from "react";
import { Menu, X } from "lucide-react";
import SKLOGO from "../../assets/sklogo.png";

const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
  return (
    <nav className="flex items-center justify-between gap-4 px-4 py-3 bg-linear-to-r from-slate-900 via-blue-800 to-blue-700 text-white shadow-xl">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden rounded-xl border border-white/15 bg-white/10 p-2 text-white hover:bg-white/20 transition"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <img
          src={SKLOGO}
          alt="SKActhub logo"
          className="h-10 w-10 rounded-2xl border border-white/20 object-contain"
        />

        <div>
          <p className="text-sm font-semibold tracking-wide">SKActhub</p>
          <p className="text-xs text-slate-200/80">
            Admin & Official workspace
          </p>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
