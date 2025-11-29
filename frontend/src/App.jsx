import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Signin from "./pages/auth/Signin";
import Signup from "./pages/auth/Signup";
import ProfilePage from "./pages/ProfilePage";
import OfficialDashboard from "./pages/officials/officialDashboard";
import Calendar from "./pages/Calendar";
import ProtectedRoute, { RoleProtectedRoute } from "./utils/Auth";
import PublicRoute from "./utils/PublicRoute";
// import UserDashboard from "./pages/youth/UserDashboard";
import SkOfficial from "./pages/admin/SkOfficial";
import Dashboard from "./pages/Dashboard";
import YouthProfiles from "./pages/admin/YouthProfiles";
import Sent from "./pages/Sent";
import BarangayManagement from "./pages/admin/BarangayManagement";
import BarangayStorage from "./pages/BarangayStorage";
const App = () => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  if (token) {
    console.log("✅ Token still exists:", token);
    console.log("✅ User still exists:", user);
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
          {/* Debug route: render Signin directly (no guard) to help troubleshoot rendering issues */}
          <Route path="/debug-signin" element={<Signin />} />
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
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sk-official"
            element={
              <ProtectedRoute>
                <SkOfficial />
              </ProtectedRoute>
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

          {/* Admin Dashboard */}
          <Route
            path="/admin-dashboard"
            element={
              <RoleProtectedRoute role={["Admin"]}>
                <Dashboard />
              </RoleProtectedRoute>
            }
          />

          <Route
            path="/admin/youth-profiles"
            element={
              <RoleProtectedRoute role={["Admin"]}>
                <YouthProfiles />
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

          {/* Sent messages */}
          <Route
            path="/sent"
            element={
              <RoleProtectedRoute role={["Official", "Youth", "Admin"]}>
                <Sent />
              </RoleProtectedRoute>
            }
          />

          {/* Profile */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Barangay Management (Admin) */}
          <Route
            path="/barangay-management"
            element={
              <RoleProtectedRoute role={["Admin"]}>
                <BarangayManagement />
              </RoleProtectedRoute>
            }
          />

          {/* Barangay Storage (All protected users) */}
          <Route
            path="/barangay-storage"
            element={
              <ProtectedRoute>
                <BarangayStorage />
              </ProtectedRoute>
            }
          />

          {/* Youth */}
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
