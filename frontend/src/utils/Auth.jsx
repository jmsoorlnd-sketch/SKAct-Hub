import React from "react";
import { Navigate } from "react-router-dom";

const RoleProtectedRoute = ({ children, role }) => {
  const token = localStorage.getItem("token");
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch (e) {
    user = null;
  }

  if (!token) return <Navigate to="/" replace />;

  if (!role.includes(user?.role)) {
    // redirect based on actual role
    if (user?.role === "Admin")
      return <Navigate to="/admin-dashboard" replace />;
    if (user?.role === "Official")
      return <Navigate to="/official-dashboard" replace />;
    if (user?.role === "Youth")
      return <Navigate to="/user-dashboard" replace />;

    return <Navigate to="/" replace />;
  }

  return children;
};

export default RoleProtectedRoute;
