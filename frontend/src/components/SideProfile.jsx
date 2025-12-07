import { useState } from "react";
import { LogOut, CircleUserRound } from "lucide-react";

const SideProfile = ({ user }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-auto relative select-none">
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between  bg-blue-200 hover:bg-blue-500 cursor-pointer p-2 rounded-lg"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            {user?.firstname?.[0] || "U"}
          </div>
          <div className="text-sm">
            <p className="font-semibold">
              {user?.firstname} {user?.lastname}
            </p>
            <p className="text-xs opacity-70">{user?.role}</p>
          </div>
        </div>
      </div>

      {open && (
        <div className="absolute bottom-14 left-0 w-48 bg-white text-black shadow-lg rounded-lg overflow-hidden animate-fadeIn border border-gray-200">
          {/* View Profile */}
          <a
            href="/profile"
            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 text-sm transition"
          >
            <CircleUserRound size={20} />
            View Profile
          </a>

          {/* Logout */}
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/";
            }}
            className="flex items-center gap-3 w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600 transition"
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
