import { BrowserRouter, Routes, Route } from "react-router-dom";
import Signin from "./pages/auth/Signin";
import Signup from "./pages/auth/Signup";
import ProfilePage from "./pages/ProfilePage";
import ProtectedRoute, { RoleProtectedRoute } from "./utils/Auth";
import PublicRoute from "./utils/PublicRoute";
import OfficialDashboard from "./pages/officials/OfficialDashboard";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SkOfficial from "./pages/admin/SkOfficial";
import Calendar from "./pages/Calendar";
import Profiles from "./pages/admin/Profiles";
import Sent from "./pages/Sent";
import BarangayManagement from "./pages/admin/BarangayManagement";
import BarangayStorage from "./pages/BarangayStorage";
import Inbox from "./pages/Inbox";
import BarangayPage from "./pages/barangay/BarangayPage";
import BarangayView from "./pages/barangay/BarangayView";
import BarangayViewPage from "./pages/barangay/BarangayViewPage";
import AdminCalendar from "./pages/admin/AdminCalendar";
import AdminSettings from "./pages/admin/AdminSettings";
import EventCalendar from "./pages/officials/EventCalendar";
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
          <Route path="/debug-signin" element={<Signin />} />
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
            path="/admin/dashboard"
            element={
              <RoleProtectedRoute role={["Admin"]}>
                <AdminDashboard />
              </RoleProtectedRoute>
            }
          />

          {/* Admin Barangays Management */}
          <Route
            path="/admin/barangays"
            element={
              <RoleProtectedRoute role={["Admin"]}>
                <BarangayManagement />
              </RoleProtectedRoute>
            }
          />

          {/* Admin Profiles */}
          <Route
            path="/admin/profiles"
            element={
              <RoleProtectedRoute role={["Admin"]}>
                <Profiles />
              </RoleProtectedRoute>
            }
          />

          {/* Admin SK Official */}
          <Route
            path="/admin/officials"
            element={
              <RoleProtectedRoute role={["Admin"]}>
                <SkOfficial />
              </RoleProtectedRoute>
            }
          />

          {/* Admin Events */}
          <Route
            path="/admin/events"
            element={
              <RoleProtectedRoute role={["Admin"]}>
                <AdminCalendar />
              </RoleProtectedRoute>
            }
          />

          {/* Admin Settings */}
          <Route
            path="/admin/settings"
            element={
              <RoleProtectedRoute role={["Admin"]}>
                <AdminSettings />
              </RoleProtectedRoute>
            }
          />

          {/* Official Event Calendar */}
          <Route
            path="/event-calendar"
            element={
              <RoleProtectedRoute role={["Official"]}>
                <EventCalendar />
              </RoleProtectedRoute>
            }
          />

          {/* Calendar */}
          <Route
            path="/calendar"
            element={
              <RoleProtectedRoute role={["Official", "Youth"]}>
                <Calendar />
              </RoleProtectedRoute>
            }
          />

          {/* Sent messages */}
          <Route
            path="/sent"
            element={
              <ProtectedRoute>
                <Sent />
              </ProtectedRoute>
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
