import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef(null);
  const containerRef = useRef(null);

  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
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
    <nav className=" bg-white p-2 border-green-50 flex justify-between items-center shadow-2xs">
      {/* LEFT SIDE / LOGO */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
          SK
        </div>
        <h1 className="text-xl font-bold tracking-wide">SKhub</h1>
      </div>
      {/* SEARCH + USER + LOGOUT
      <div className="flex items-center gap-4" ref={containerRef}>
        {isAdmin && (
          <div className="relative">
            <input
              aria-label="Admin search users and messages"
              className="border rounded-lg px-3 py-2 w-72 focus:outline-none focus:ring focus:ring-blue-400"
              placeholder="Search users or messages (min 2 chars)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (results) setOpen(true);
              }}
            />

            {open && query.trim().length >= 2 && (
              <div className="absolute right-0 mt-2 w-96 bg-white border rounded shadow-lg z-50 max-h-72 overflow-auto">
                {loading ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    Searching...
                  </div>
                ) : results ? (
                  <>
                    <div className="p-2 text-xs text-gray-500 border-b font-semibold">
                      Users
                    </div>
                    {results.users && results.users.length > 0 ? (
                      results.users.map((entry) => (
                        <div
                          key={entry.user._id}
                          className="p-3 border-b hover:bg-gray-50"
                        >
                          <div className="font-semibold text-sm">
                            {entry.user.username} ({entry.user.firstname}{" "}
                            {entry.user.lastname})
                          </div>
                          <div className="text-xs text-gray-500">
                            {entry.user.email}
                          </div>
                          {entry.messages && entry.messages.length > 0 && (
                            <div className="mt-2 bg-blue-50 p-2 rounded">
                              <p className="text-xs font-semibold text-gray-700 mb-1">
                                Messages sent: {entry.messages.length}
                              </p>
                              {entry.messages.slice(0, 3).map((m) => (
                                <div
                                  key={m._id}
                                  className="text-xs py-1 border-b last:border-0"
                                >
                                  <div className="font-semibold text-gray-800">
                                    {m.subject || "No subject"}
                                  </div>
                                  <div className="text-gray-600 truncate">
                                    {m.body}
                                  </div>
                                  <div className="text-gray-500 text-xs">
                                    Status: {m.status}
                                  </div>
                                </div>
                              ))}
                              {entry.messages.length > 3 && (
                                <div className="text-xs text-blue-600 mt-1 font-semibold">
                                  +{entry.messages.length - 3} more messages
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-sm text-gray-500">
                        No users found
                      </div>
                    )}

                    <div className="p-2 text-xs text-gray-500 border-t font-semibold">
                      Messages by Content
                    </div>
                    {results.messagesMatches &&
                    results.messagesMatches.length > 0 ? (
                      results.messagesMatches.map((m) => (
                        <div
                          key={m._id}
                          className="p-3 border-b hover:bg-gray-50"
                        >
                          <div className="font-semibold text-sm">
                            {m.subject || "No subject"}
                          </div>
                          <div className="text-xs text-gray-600">
                            From: {m.sender?.username} ({m.sender?.firstname}{" "}
                            {m.sender?.lastname})
                          </div>
                          <div className="text-sm text-gray-700 mt-1">
                            {m.body}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-sm text-gray-500">
                        No messages found by content
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-3 text-sm text-gray-500">
                    Type to search...
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div> */}
    </nav>
  );
};

export default Navbar;
