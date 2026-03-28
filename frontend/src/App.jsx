import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { lazy, Suspense } from "react";
// Layout & Auth
import Layout from "./layout/Layout";
import PublicRoute from "./utils/PublicRoute";
import RequireAuth from "./utils/RequireAuth";
import RequireRole from "./utils/RequireRole";

// Auth Pages
import Signin from "./pages/auth/Signin";
import Signup from "./pages/auth/Signup";

// Common Pages
// import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
// import Sent from "./pages/Sent";
import Inbox from "./pages/Inbox";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import SkOfficial from "./pages/admin/SkOfficial";
import SkPersonnelAdmin from "./pages/admin/SkPersonnelAdmin";
// import Calendar from "./pages/Calendar";
// import Profiles from "./pages/admin/Profiles";
// import BarangayManagement from "./pages/admin/BarangayManagement";
import AdminCalendar from "./pages/admin/AdminCalendar";
// import AdminSettings from "./pages/admin/AdminSettings";

const AdminMonitoring = lazy(() => import("./pages/admin/AdminMonitoring"));
import AdminNotification from "./pages/admin/AdminNotification";
const AdminArchive = lazy(() => import("./pages/admin/AdminArchive"));
const AdminUserLogs = lazy(() => import("./pages/admin/AdminUserLogs"));

// Official Pages
// import OfficialDashboard from "./pages/officials/OfficialDashboard";

import EventCalendar from "./pages/officials/EventCalendar";
import SKPersonnelPage from "./pages/officials/SKPersonnelPage";

// Barangay Pages
const BarangayStorage = lazy(() => import("./pages/BarangayStorage"));
// import BarangayPage from "./pages/barangay/BarangayPage";
// import BarangayViewPage from "./pages/barangay/BarangayViewPage";
import Archive from "./pages/Archive";

/* ===================== ROLES ===================== */
const roles = {
  ADMIN: "admin",
  OFFICIAL: "official",
  YOUTH: "youth",
};

/* ===================== APP ROUTES ===================== */
const AppRoutes = () => {
  return (
    <Routes>
      {/* ===== PUBLIC ROUTES ===== */}
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

      {/* ===== PROTECTED ROUTES ===== */}
      <Route element={<RequireAuth />}>
        {/* Layout wraps all protected routes */}
        <Route element={<Layout />}>
          {/* COMMON */}
          {/* <Route path="/dashboard" element={<Dashboard />} /> */}
          <Route path="/profile" element={<ProfilePage />} />
          {/* <Route path="/sent" element={<Sent />} /> */}

          {/* BARANGAY */}
          <Route
            path="/barangay-storage"
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <BarangayStorage />
              </Suspense>
            }
          />
          {/* <Route path="/barangay-page" element={<BarangayPage />} />
          <Route
            path="/barangay-view/:barangayId"
            element={<BarangayViewPage />}
          /> */}

          {/* ADMIN */}
          <Route
            path="/admin/dashboard"
            element={
              <RequireRole allowedRoles={[roles.ADMIN]}>
                <AdminDashboard />
              </RequireRole>
            }
          />
          {/* <Route
            path="/admin/barangays"
            element={
              <RequireRole allowedRoles={[roles.ADMIN]}>
                <BarangayManagement />
              </RequireRole>
            }
          />
          <Route
            path="/admin/profiles"
            element={
              <RequireRole allowedRoles={[roles.ADMIN]}>
                <Profiles />
              </RequireRole>
            }
          /> */}
          <Route
            path="/admin/sk-officials"
            element={
              <RequireRole allowedRoles={[roles.ADMIN]}>
                <SkOfficial />
              </RequireRole>
            }
          />
          <Route
            path="/admin/sk-personnel"
            element={
              <RequireRole allowedRoles={[roles.ADMIN]}>
                <SkPersonnelAdmin />
              </RequireRole>
            }
          />
          <Route
            path="/admin/events"
            element={
              <RequireRole allowedRoles={[roles.ADMIN]}>
                <AdminCalendar />
              </RequireRole>
            }
          />
          <Route
            path="/admin/monitoring"
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <RequireRole allowedRoles={[roles.ADMIN]}>
                  <AdminMonitoring />
                </RequireRole>
              </Suspense>
            }
          />
          {/* <Route
            path="/admin/settings"
            element={
              <RequireRole allowedRoles={[roles.ADMIN]}>
                <AdminSettings />
              </RequireRole>
            }
          /> */}
          <Route
            path="/admin/notifications"
            element={
              <RequireRole allowedRoles={[roles.ADMIN]}>
                <AdminNotification />
              </RequireRole>
            }
          />
          <Route
            path="/admin/archive"
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <RequireRole allowedRoles={[roles.ADMIN]}>
                  <AdminArchive />
                </RequireRole>
              </Suspense>
            }
          />
          <Route
            path="/admin/user-logs"
            element={
              <Suspense fallback={<div>Loading...</div>}>
                <RequireRole allowedRoles={[roles.ADMIN]}>
                  <AdminUserLogs />
                </RequireRole>
              </Suspense>
            }
          />

          {/* OFFICIAL */}
          {/* <Route
            path="/official-dashboard"
            element={
              <RequireRole allowedRoles={[roles.OFFICIAL]}>
                <OfficialDashboard />
              </RequireRole>
            }
          /> */}
          <Route
            path="/official/inbox"
            element={
              <RequireRole allowedRoles={[roles.OFFICIAL]}>
                <Inbox />
              </RequireRole>
            }
          />
          <Route
            path="/event-calendar"
            element={
              <RequireRole allowedRoles={[roles.OFFICIAL]}>
                <EventCalendar />
              </RequireRole>
            }
          />
          <Route
            path="/sk-personnel"
            element={
              <RequireRole allowedRoles={[roles.OFFICIAL]}>
                <SKPersonnelPage />
              </RequireRole>
            }
          />
          <Route
            path="/archive"
            element={
              <RequireRole allowedRoles={[roles.OFFICIAL]}>
                <Archive />
              </RequireRole>
            }
          />
          {/* <Route
            path="/calendar"
            element={
              <RequireRole allowedRoles={[roles.OFFICIAL, roles.YOUTH]}>
                <Calendar />
              </RequireRole>
            }
          /> */}
        </Route>
      </Route>

      {/* ===== CATCH-ALL ===== */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

/* ===================== MAIN APP COMPONENT ===================== */
const App = () => (
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
);

export default App;
