import React from "react";
import { Navigate } from "react-router-dom";

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch (e) {
    user = null;
  }

  // If logged in, block access to signin/signup
  // Only redirect when token exists AND user has a valid role string
  if (token && typeof user === "object" && typeof user.role === "string") {
    // Normalize role string just in case
    const role = user.role;
    if (role === "Admin") return <Navigate to="/admin-dashboard" replace />;
    if (role === "Official")
      return <Navigate to="/official-dashboard" replace />;
    // role for youth users in the backend is 'Youth'
    if (role === "Youth") return <Navigate to="/user-dashboard" replace />;
  }

  return children; // not logged in → allow access
};

export default PublicRoute;
