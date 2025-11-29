import React from "react";
import { Navigate } from "react-router-dom";

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    user = null;
  }

  // If logged in, block access to signin/signup
  // Only redirect when token looks valid AND user has a valid role string
  const looksLikeJwt =
    typeof token === "string" &&
    token.trim() &&
    token.trim().toLowerCase() !== "null" &&
    token.trim().toLowerCase() !== "undefined" &&
    token.split &&
    token.split(".").length === 3;

  if (
    looksLikeJwt &&
    user &&
    typeof user === "object" &&
    typeof user.role === "string" &&
    String(user.role).trim() &&
    String(user.role).trim().toLowerCase() !== "null"
  ) {
    const role = String(user.role).trim().toLowerCase();
    // debug
    console.debug(
      "PublicRoute: valid token?",
      looksLikeJwt,
      "user.role=",
      role
    );
    if (role === "admin") return <Navigate to="/admin-dashboard" replace />;
    if (role === "official")
      return <Navigate to="/official-dashboard" replace />;
    if (role === "youth") return <Navigate to="/dashboard" replace />;
  }

  return children; // not logged in → allow access
};

export default PublicRoute;
