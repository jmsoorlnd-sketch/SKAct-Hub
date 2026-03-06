import { useState, useContext } from "react";
import { LogOut, CircleUserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const SideProfile = ({ user }) => {
  const [open, setOpen] = useState(false);
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <div className="mt-auto relative select-none">
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between bg-blue-200 hover:bg-blue-500 cursor-pointer p-2 rounded-lg transition gap-2"
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 sm:w-10 h-8 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
            {user?.firstname?.[0] || "U"}
          </div>
          <div className="text-xs sm:text-sm hidden sm:block">
            <p className="font-semibold truncate">
              {user?.firstname} {user?.lastname}
            </p>
            <p className="text-xs opacity-70 truncate">
              {user?.role} {user?.position}
            </p>
          </div>
        </div>
      </div>

      {open && (
        <div className="absolute bottom-14 left-0 w-40 sm:w-48 bg-white text-black shadow-lg rounded-lg overflow-hidden animate-fadeIn border border-gray-200 z-50">
          {/* View Profile */}
          <a
            href="/profile"
            className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 hover:bg-gray-100 text-xs sm:text-sm transition"
          >
            <CircleUserRound size={18} className="sm:w-5 sm:h-5 w-4 h-4" />
            <span className="hidden sm:inline">View Profile</span>
            <span className="sm:hidden">Profile</span>
          </a>

          {/* Logout */}
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="flex items-center gap-2 sm:gap-3 w-full text-left px-3 sm:px-4 py-2 hover:bg-gray-100 text-xs sm:text-sm text-red-600 transition"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default SideProfile;
