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
    origin: "http://localhost:5173", // Your React app URL
    methods: ["GET", "POST"],
    credentials: true,
  },
});

//middleware
app.use(cors());
app.use(express.json());

// Make io accessible to routes
app.set("io", io);

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // User joins their personal room for private notifications
  socket.on("join-user", (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // Join barangay room for barangay-specific updates
  socket.on("join-barangay", (barangayId) => {
    socket.join(`barangay-${barangayId}`);
    console.log(`User joined barangay room: ${barangayId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

//routes (same as before)
import UserRoute from "./routes/UserRoute.js";
import MessageRoute from "./routes/MessageRoute.js";
import BarangayRoute from "./routes/BarangayRoute.js";
import SearchRoute from "./routes/SearchRoute.js";
import SKPersonnelRoute from "./routes/SKPersonnelRoute.js";
import NotificationRoute from "./routes/NotificationRoute.js";
import UserLogRoute from "./routes/UserLogRoute.js";

app.use("/api/users", UserRoute);
app.use("/api/messages", MessageRoute);
app.use("/api/barangays", BarangayRoute);
app.use("/api/search", SearchRoute);
app.use("/api/sk-personnel", SKPersonnelRoute);
app.use("/api/notifications", NotificationRoute);
app.use("/api/user-logs", UserLogRoute);

import AdminRoute from "./routes/AdminRoute.js";
app.use("/api/admins", AdminRoute);

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
  console.log(`Server running on port ${PORT}`);
});
