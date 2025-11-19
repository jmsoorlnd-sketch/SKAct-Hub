import React from "react";
import { Navigate } from "react-router-dom";

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  // If logged in, block access to signin/signup
  if (token && user?.role) {
    if (user.role === "Admin")
      return <Navigate to="/admin-dashboard" replace />;
    if (user.role === "Official")
      return <Navigate to="/official-dashboard" replace />;
    if (user.role === "User") return <Navigate to="/user-dashboard" replace />;
  }

  return children; // not logged in → allow access
};

export default PublicRoute;
