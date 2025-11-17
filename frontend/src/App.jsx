import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Signin from "./pages/Signin";
import Signup from "./pages/Signup";
import ProfilePage from "./pages/ProfilePage";
import Public from "./components/Public";
import Protected from "./components/Protected";
import Projects from "./pages/Projects";
import Youth from "./pages/Youth";

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
          <Route
            path="/"
            element={
              <Public>
                <Signin />
              </Public>
            }
          />
          <Route
            path="/signup"
            element={
              <Public>
                {" "}
                <Signup />
              </Public>
            }
          />
          <Route
            path="/profile"
            element={
              <Protected>
                <ProfilePage />
              </Protected>
            }
          />
          <Route
            path="/dashboard"
            element={
              <Protected>
                <Dashboard />
              </Protected>
            }
          />

          <Route
            path="/project"
            element={
              <Protected>
                <Projects />
              </Protected>
            }
          />
          <Route
            path="/youthprofiles"
            element={
              <Protected>
                <Youth />
              </Protected>
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
};

export default App;
