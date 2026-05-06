import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { Menu, X, LogOut } from "lucide-react";
import SKLOGO from "../../assets/sklogo.png";

const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const displayName =
    user?.firstname || user?.username || user?.email || "User";
  const displayRole = user?.role ? user.role.toUpperCase() : "USER";

  return (
    <nav className="flex items-center justify-between gap-4 px-4 py-3 bg-gradient-to-r from-slate-900 via-blue-800 to-blue-700 text-white shadow-xl">
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

      <div className="hidden md:flex items-center gap-3">
        <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm shadow-sm">
          <p className="font-semibold text-white truncate w-44">
            {displayName}
          </p>
          <span className="text-[11px] uppercase tracking-[0.18em] text-slate-200/80">
            {displayRole}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
