import React from "react";
import { Navigate } from "react-router-dom";

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (token) return <Navigate to="/dashboard" replace />; // logged in → redirect

  return children;
};

export default PublicRoute;
