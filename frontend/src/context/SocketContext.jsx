import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import io from "socket.io-client";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Get token from localStorage
    const token = localStorage.getItem("token");
    let user = null;

    try {
      const userData = localStorage.getItem("user");
      if (userData && userData !== "undefined" && userData !== "null") {
        user = JSON.parse(userData);
      }
    } catch (err) {
      console.error("Failed to parse user:", err);
    }

    if (!token || !user?._id) {
      console.log("No token or user found, skipping socket connection");
      return;
    }

    console.log("🔄 Attempting to connect to socket server...");

    // Initialize socket connection with auth
    const newSocket = io("http://localhost:5000", {
      auth: { token },
      transports: ["polling", "websocket"], // Try polling first, then upgrade to websocket
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current = newSocket;

    // Connection event handlers
    newSocket.on("connect", () => {
      console.log("✅ Socket connected successfully", newSocket.id);
      setIsConnected(true);
      setConnectionError(null);

      // Join user-specific room
      newSocket.emit("join", { userId: user._id });
      console.log(`📡 Emitted join for user: ${user._id}`);

      // Join role-specific room if needed
      if (user.role) {
        newSocket.emit("join-role", { role: user.role });
      }

      // Join barangay room if user has barangay
      if (user.barangay) {
        const barangayId = user.barangay._id || user.barangay;
        newSocket.emit("join-barangay", { barangayId });
        console.log(`📡 Joined barangay-${barangayId}`);
      }
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    newSocket.on("error", (error) => {
      console.error("❌ Socket error:", error);
    });

    newSocket.on("join-confirmed", (data) => {
      console.log("✅ Join confirmed:", data);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log("🧹 Cleaning up socket connection");
      if (newSocket) {
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, []);

  const value = {
    socket,
    isConnected,
    connectionError,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
