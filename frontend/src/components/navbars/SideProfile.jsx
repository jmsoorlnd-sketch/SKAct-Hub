import { useState, useContext, useRef, useEffect } from "react";
import { LogOut, User, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { AuthContext } from "../../context/AuthContext";
import ConfirmModal from "../ConfirmModal";

const SideProfile = ({ user }) => {
  const [open, setOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
    setOpen(false);
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    navigate("/", { replace: true });
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  const fullName =
    [user?.firstname, user?.lastname].filter(Boolean).join(" ") ||
    user?.username ||
    "Guest";
  const roleLabel = user?.role ? user.role : "Guest";

  return (
    <>
      <div className="relative select-none">
        <div
          onClick={() => setOpen(!open)}
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md transition cursor-pointer"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-indigo-600 text-white font-bold shadow-md">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">
              {fullName}
            </p>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              {roleLabel}
            </p>
          </div>
          <div className={`transition-transform ${open ? "rotate-180" : ""}`}>
            <svg
              className="w-3 h-3 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {open && (
          <div
            ref={dropdownRef}
            className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
          >
            <a
              href="/profile"
              className="flex items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              <User size={16} className="text-blue-600" />
              <span>View Profile</span>
            </a>
            <button
              onClick={handleLogoutClick}
              className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>

      {showLogoutModal &&
        createPortal(
          <ConfirmModal
            isOpen={showLogoutModal}
            title="Confirm Logout"
            message="Are you sure you want to logout? You will need to sign in again to access your account."
            icon={AlertTriangle}
            iconBgClass="bg-red-600"
            iconColorClass="text-white"
            confirmText="Logout"
            confirmIcon={LogOut}
            confirmClass="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
            onConfirm={handleConfirmLogout}
            onCancel={handleCancelLogout}
          />,
          document.body,
        )}
    </>
  );
};

export default SideProfile;
