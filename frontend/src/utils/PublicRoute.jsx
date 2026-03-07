import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const PublicRoute = ({ children }) => {
  const { user } = useContext(AuthContext); // get logged-in user

  // If user is logged in, redirect based on role
  if (user && user.role) {
    switch (user.role) {
      case "Official":
        return <Navigate to="/official/inbox" replace />;
      case "Admin":
        return <Navigate to="/admin/notifications" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  // Not logged in → show public page (login/signup)
  return children;
};

export default PublicRoute;
