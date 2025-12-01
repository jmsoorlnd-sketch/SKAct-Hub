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
    const raw = localStorage.getItem("user");
    if (raw && raw !== "undefined" && raw !== "null") {
      user = JSON.parse(raw);
    }
  } catch (err) {
    user = null;
  }

  if (!token) return <Navigate to="/" replace />;

  const allowed = (Array.isArray(role) ? role : [role]).map((r) =>
    String(r).trim().toLowerCase()
  );
  const normalizedUserRole = String(user?.role || "")
    .trim()
    .toLowerCase();

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
