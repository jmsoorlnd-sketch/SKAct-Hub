import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

//dotenv config
dotenv.config();
const app = express();

//middleware
app.use(cors());
app.use(express.json());

//routes
import UserRoute from "./routes/UserRoute.js";
import MessageRoute from "./routes/MessageRoute.js";
import BarangayRoute from "./routes/BarangayRoute.js";
app.use("/api/users", UserRoute);
app.use("/api/messages", MessageRoute);
app.use("/api/barangays", BarangayRoute);

import AdminRoute from "./routes/AdminRoute.js";
app.use("/api/admins", AdminRoute);

app.use("/api/posts", (req, res) => {
  res.send("Posts route is under construction.");
});

//port setup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
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
