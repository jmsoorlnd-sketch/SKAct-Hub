import { useState } from "react";

const SideProfile = ({ user }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-auto relative select-none">
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between  bg-blue-300 hover:bg-blue-500 cursor-pointer p-2 rounded-lg"
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
        <div className="absolute bottom-14 left-0 w-full bg-white text-black shadow-lg rounded-lg overflow-hidden animate-fadeIn">
          <a
            href="/profile"
            className="block px-4 py-2 hover:bg-gray-100 text-sm"
          >
            View Profile
          </a>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/";
            }}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default SideProfile;
