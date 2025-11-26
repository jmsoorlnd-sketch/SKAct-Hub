import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Signin from "./pages/auth/Signin";
import Signup from "./pages/auth/Signup";
import ProfilePage from "./pages/ProfilePage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import OfficialDashboard from "./pages/officials/officialDashboard";
import Calendar from "./pages/Calendar";
import RoleProtectedRoute from "./utils/Auth";
import PublicRoute from "./utils/PublicRoute";
const App = () => {
  const token = localStorage.getItem("token");

  if (token) {
    console.log("✅ Token still exists:", token);
  } else {
    console.log("🚫 No token found — user is logged out");
  }

  return (
    <div>
      <BrowserRouter>
        <Routes>
          {/* AUTH */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <Signin />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          />

          {/* ADMIN */}
          <Route
            path="/admin-dashboard"
            element={
              <RoleProtectedRoute role={["Admin"]}>
                <AdminDashboard />
              </RoleProtectedRoute>
            }
          />

          {/* Official */}
          <Route
            path="/official-dashboard"
            element={
              <RoleProtectedRoute role={["Official"]}>
                <OfficialDashboard />
              </RoleProtectedRoute>
            }
          />

          {/* Calendar */}
          <Route
            path="/calendar"
            element={
              <RoleProtectedRoute role={["Admin", "Official", "Youth"]}>
                <Calendar />
              </RoleProtectedRoute>
            }
          />

          {/* Youth */}
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
