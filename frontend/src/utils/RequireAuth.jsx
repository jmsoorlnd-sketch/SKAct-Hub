import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAuthUser } from "./Auth";

const RequireAuth = () => {
  const location = useLocation();
  const auth = getAuthUser();

  if (!auth) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  const isProfileComplete = !!(auth.user?.hasEmail || auth.user?.email?.trim());

  const isSetupPage =
    location.pathname === "/profile-create" &&
    location.search.includes("setup=true");

  if (!isProfileComplete && !isSetupPage) {
    return <Navigate to="/profile-create?setup=true" replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
