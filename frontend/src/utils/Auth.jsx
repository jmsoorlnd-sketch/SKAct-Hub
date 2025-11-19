import React from "react";
import { Navigate } from "react-router-dom";

const RoleProtectedRoute = ({ children, role }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token) return <Navigate to="/" replace />;

  if (!role.includes(user?.role)) {
    // redirect based on actual role
    if (user?.role === "Admin")
      return <Navigate to="/admin-dashboard" replace />;
    if (user?.role === "Official")
      return <Navigate to="/official-dashboard" replace />;
    if (user?.role === "User") return <Navigate to="/user-dashboard" replace />;

    return <Navigate to="/" replace />;
  }

  return children;
};

export default RoleProtectedRoute;
