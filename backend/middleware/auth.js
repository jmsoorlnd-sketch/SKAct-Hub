import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";

// requireAuth now resolves the user document so downstream handlers
// can inspect position, barangay, etc. Token payload only contains _id/role.
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET not configured for token verification");
      return res
        .status(500)
        .json({ message: "Authentication configuration error" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // load full user record (excluding password)
    const user = await User.findById(decoded._id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "Invalid user" });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    return res.status(401).json({ message: "Invalid token" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role?.toLowerCase() === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Admin Only" });
    console.log("shut");
  }
};

const officialOnly = (req, res, next) => {
  if (req.user && req.user.role?.toLowerCase() === "official") {
    next();
  } else {
    res.status(403).json({ message: "Official Only" });
  }
};

export { requireAuth, adminOnly, officialOnly };
