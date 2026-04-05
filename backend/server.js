import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import http from "http";
import { Server } from "socket.io";

//dotenv config
dotenv.config();
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"], // Your React app URLs
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"], // Allow both
  allowEIO3: true,
});

//middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  }),
);
app.use(express.json());

// Make io accessible to routes
app.set("io", io);

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("✅ New client connected:", socket.id);

  // 🔧 FIX: Listen for 'join' event (what your client emits)
  socket.on("join", ({ userId }) => {
    if (userId) {
      socket.join(`user-${userId}`);
      console.log(`✅ User ${userId} joined room: user-${userId}`);
      socket.emit("join-confirmed", { room: `user-${userId}` });
    }
  });

  // Listen for 'join-role' event
  socket.on("join-role", ({ role }) => {
    if (role) {
      socket.join(`role-${role}`);
      console.log(`✅ User joined role room: role-${role}`);
    }
  });

  // Listen for 'join-barangay' event
  socket.on("join-barangay", ({ barangayId }) => {
    if (barangayId) {
      socket.join(`barangay-${barangayId}`);
      console.log(`✅ User joined barangay room: barangay-${barangayId}`);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Client disconnected:", socket.id, "Reason:", reason);
  });

  socket.on("error", (error) => {
    console.error("Socket error:", error);
  });
});

//routes
import UserRoute from "./routes/UserRoute.js";
import MessageRoute from "./routes/MessageRoute.js";
import BarangayRoute from "./routes/BarangayRoute.js";
import SearchRoute from "./routes/SearchRoute.js";
import SKPersonnelRoute from "./routes/SKPersonnelRoute.js";
import NotificationRoute from "./routes/NotificationRoute.js";
import UserLogRoute from "./routes/UserLogRoute.js";
import AdminRoute from "./routes/AdminRoute.js";
import ReportRoute from "./routes/ReportRoute.js";

app.use("/api/users", UserRoute);
app.use("/api/messages", MessageRoute);
app.use("/api/barangays", BarangayRoute);
app.use("/api/search", SearchRoute);
app.use("/api/sk-personnel", SKPersonnelRoute);
app.use("/api/notifications", NotificationRoute);
app.use("/api/user-logs", UserLogRoute);
app.use("/api/admins", AdminRoute);
app.use("/api/reports", ReportRoute);

app.use("/api/posts", (req, res) => {
  res.send("Posts route is under construction.");
});

// Basic route for testing
app.get("/", (req, res) => {
  res.send("Hello from the backend server!");
});

// MongoDB connection
import connectDB from "./configDB.js";
connectDB();

// serve uploaded files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

//port setup
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO listening on ws://localhost:${PORT}`);
});
