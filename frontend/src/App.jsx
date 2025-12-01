import { BrowserRouter, Routes, Route } from "react-router-dom";
import Signin from "./pages/auth/Signin";
import Signup from "./pages/auth/Signup";
import ProfilePage from "./pages/ProfilePage";
import ProtectedRoute from "./utils/Auth";
import PublicRoute from "./utils/PublicRoute";
import SkOfficial from "./pages/admin/SkOfficial";
import Dashboard from "./pages/Dashboard";
import BarangayStorage from "./pages/BarangayStorage";
import Inbox from "./pages/Inbox";
import BarangayPage from "./pages/barangay/BarangayPage";
import BarangayView from "./pages/barangay/BarangayView";
import BarangayViewPage from "./pages/barangay/BarangayViewPage";
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

          {/* Sent messages */}

          {/* Profile */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inbox"
            element={
              <ProtectedRoute>
                <Inbox />
              </ProtectedRoute>
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
          <Route
            path="/barangay-page"
            element={
              <ProtectedRoute>
                <BarangayPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/barangay-view/:barangayId"
            element={
              <ProtectedRoute>
                <BarangayViewPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
