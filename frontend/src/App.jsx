import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Signin from "./pages/auth/Signin";
import Signup from "./pages/auth/Signup";
import ProfilePage from "./pages/ProfilePage";
// import Dashboard from "./pages/Dashboard";
import PublicRoute from "./utils/PublicRoute";
// import UserDashboard from "./pages/youth/UserDashboard";
import SkOfficial from "./pages/admin/SkOfficial";
import ProtectedRoute from "./utils/Auth";
import Dashboard from "./pages/Dashboard";
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
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
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
