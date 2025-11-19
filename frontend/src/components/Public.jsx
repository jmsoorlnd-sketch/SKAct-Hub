import React from "react";
import { isAdmin, isUser, isOfficial } from "../utils/Auth";
import { Navigate } from "react-router-dom";

const Public = ({ children }) => {
  if (isAdmin()) return <Navigate to="/admin-dashboard" replace />;
  if (isOfficial()) return <Navigate to="/official-dashboard" replace />;
  if (isUser()) return <Navigate to="/user-dashboard" replace />;

  return children; // No user logged in, show public page
};

export default Public;
