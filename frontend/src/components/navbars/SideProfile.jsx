import { useState, useContext, useRef, useEffect } from "react";
import { LogOut, User, X, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { AuthContext } from "../../context/AuthContext";

const SideProfile = ({ user }) => {
  /* ==================== STATE ==================== */
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

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* ==================== HANDLERS ==================== */
  const handleLogoutClick = () => {
    setOpen(false);
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate("/");
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  /* ==================== RENDER ==================== */
  return (
    <>
      <div className="relative select-none">
        {/* Profile Button */}
        <div
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 p-2 bg-gradient-to-r from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 rounded-lg cursor-pointer transition-all border border-blue-200"
        >
          {/* Avatar */}
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm">
            {user?.firstname?.[0]?.toUpperCase() || "U"}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate leading-tight">
              {user?.firstname} {user?.lastname}
            </p>
            <p className="text-[10px] text-slate-600 truncate leading-tight">
              {user?.role} {user?.position}
            </p>
          </div>

          {/* Dropdown Arrow */}
          <svg
            className={`w-3 h-3 text-slate-600 transition-transform flex-shrink-0 ${
              open ? "rotate-180" : ""
            }`}
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

        {/* Dropdown Menu */}
        {open && (
          <div ref={dropdownRef} className="mt-auto relative select-none">
            {/* View Profile */}
            <a
              href="/profile"
              className="flex items-center gap-2 px-3 py-2 hover:bg-blue-200 text-xs font-semibold text-slate-700 transition-colors"
            >
              <User size={14} className="text-blue-600" />
              <span>View Profile</span>
            </a>
            {/* Logout */}
            <button
              onClick={handleLogoutClick}
              className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-red-200 text-xs font-semibold text-red-600 transition-colors border-t border-slate-200"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal &&
        createPortal(
          <div className="fixed inset-0 bg-black/50  flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-fadeIn">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5">
                <div className="flex items-center gap-3 text-white">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Confirm Logout</h2>
                    <p className="text-xs text-red-100 mt-0.5">
                      Please confirm your action
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <p className="text-sm text-slate-700 leading-relaxed">
                  Are you sure you want to logout? You will need to sign in
                  again to access your account.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t-2 border-slate-200 flex gap-3">
                <button
                  onClick={handleCancelLogout}
                  className="flex-1 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmLogout}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Fade-in Animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default SideProfile;
