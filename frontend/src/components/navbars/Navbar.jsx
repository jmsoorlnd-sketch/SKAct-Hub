import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <nav className="border-b bg-white px-6 py-4 flex justify-between items-center shadow-sm">
      {/* LEFT SIDE / LOGO */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
          SK
        </div>
        <h1 className="text-xl font-bold tracking-wide">SKhub</h1>
      </div>

      {/* USER + LOGOUT */}
      <div className="flex items-center gap-4">
        <a
          href="/profile"
          className="text-gray-700 hover:text-blue-600 transition font-medium"
        >
          User Profile
        </a>

        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
