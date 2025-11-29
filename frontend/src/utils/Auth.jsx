import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/" replace />;
  return children;
};

export const RoleProtectedRoute = ({ children, role = [] }) => {
  const token = localStorage.getItem("token");
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    user = null;
  }

  if (!token) return <Navigate to="/" replace />;
  // Normalize and compare roles case-insensitively
  const allowed = (Array.isArray(role) ? role : [role]).map((r) =>
    String(r).trim().toLowerCase()
  );
  const normalizedUserRole = String(user?.role || "")
    .trim()
    .toLowerCase();

  // Debugging info to help track redirect issues in-browser
  console.debug(
    "RoleProtectedRoute: token:",
    !!token,
    "userRole:",
    normalizedUserRole,
    "allowed:",
    allowed
  );

  if (!user || !allowed.includes(normalizedUserRole)) {
    if (normalizedUserRole === "admin")
      return <Navigate to="/admin-dashboard" replace />;
    if (normalizedUserRole === "official")
      return <Navigate to="/official-dashboard" replace />;
    if (normalizedUserRole === "youth")
      return <Navigate to="/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
