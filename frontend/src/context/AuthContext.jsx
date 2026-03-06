import { createContext, useEffect, useState, useRef, useCallback } from "react";

const AuthContext = createContext();

// 20 minutes in milliseconds
const INACTIVITY_TIMEOUT = 20 * 60 * 1000;

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const inactivityTimerRef = useRef(null);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
  }, []);

  // Reset inactivity timer
  const resetInactivityTimer = useCallback(() => {
    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // Only set new timer if user is logged in
    if (localStorage.getItem("token")) {
      inactivityTimerRef.current = setTimeout(() => {
        console.warn("User inactive for 20 minutes. Logging out...");
        logout();
      }, INACTIVITY_TIMEOUT);
    }
  }, [logout]);

  // Initialize auth on app load
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (token && storedUser) {
      try {
        const cleaned = String(storedUser).trim();
        if (
          cleaned &&
          cleaned.toLowerCase() !== "undefined" &&
          cleaned.toLowerCase() !== "null"
        ) {
          setUser(JSON.parse(cleaned));
          // Start inactivity timer when user is loaded
          resetInactivityTimer();
        }
      } catch (err) {
        console.warn("Failed to parse stored user from localStorage:", err);
      }
    }
  }, [resetInactivityTimer]);

  // Track user activity and reset timer
  useEffect(() => {
    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];

    const handleActivity = () => {
      resetInactivityTimer();
    };

    events.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [resetInactivityTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
