import { createContext, useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";

const AuthContext = createContext();
const API_BASE = "http://localhost:5000/api";

// 20 minutes in milliseconds
const INACTIVITY_TIMEOUT = 20 * 60 * 1000;

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const inactivityTimerRef = useRef(null);

  // Logout function
  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        // Call backend logout endpoint to log the action
        await axios.post(
          `${API_BASE}/users/logout`,
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        );
      }
    } catch (error) {
      console.error("Error logging logout:", error);
      // Continue with logout even if logging fails
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
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

  // Universal axios auth interceptors for expired/invalid tokens
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const status = error?.response?.status;
        const message = error?.response?.data?.message;

        if (
          status === 401 &&
          (message === "Token expired" ||
            message === "Invalid token" ||
            !message)
        ) {
          console.warn(
            "Session invalid or expired, performing local logout.",
            message,
          );
          await logout();
          window.location.replace("/signin");
        }

        return Promise.reject(error);
      },
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [logout]);

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
