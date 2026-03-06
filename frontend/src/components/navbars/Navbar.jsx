import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { Menu, X } from "lucide-react";
import SKLOGO from "../../assets/sklogo.png";

const Navbar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef(null);
  const containerRef = useRef(null);

  const token = localStorage.getItem("token");

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const fetchSearch = async (q) => {
    if (!q || q.trim().length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      console.log("Fetching search for:", q);
      console.log("Token:", token ? "exists" : "missing");

      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      console.log("Search response status:", res.status);

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Search error response:", errorData);
        setResults(null);
        setLoading(false);
        return;
      }
      const data = await res.json();
      console.log("Search results:", data);
      setResults(data);
      setOpen(true);
    } catch (err) {
      console.error("Search error", err);
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // debounce
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!query || query.trim().length < 2) {
      setResults(null);
      setOpen(false);
      return;
    }
    // Open dropdown immediately when query is >=2 chars
    setOpen(true);
    setLoading(true);
    timeoutRef.current = setTimeout(() => fetchSearch(query.trim()), 300);
    return () => clearTimeout(timeoutRef.current);
  }, [query]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Get user role from context or localStorage fallback
  let userRole = user?.role;
  if (!userRole) {
    try {
      const stored = localStorage.getItem("user");
      if (stored && stored !== "undefined" && stored !== "null") {
        const parsed = JSON.parse(stored);
        userRole = parsed?.role;
      }
    } catch (err) {
      console.warn("Failed to parse user from localStorage", err);
    }
  }
  const isAdmin = String(userRole || "").toLowerCase() === "admin";
  console.log("Navbar debug - userRole:", userRole, "isAdmin:", isAdmin);

  return (
    <nav className="bg-white p-2 sm:p-4 border-green-50 flex justify-between items-center shadow-2xs gap-2 sm:gap-4">
      {/* Mobile Menu Button & Logo */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <img
          src={SKLOGO}
          alt="Logo"
          className="h-8 sm:h-10 w-8 sm:w-10 object-contain"
        />
        <h1 className="text-lg sm:text-xl font-bold tracking-wide hidden sm:block">
          SKActhub
        </h1>
      </div>
    </nav>
  );
};

export default Navbar;
