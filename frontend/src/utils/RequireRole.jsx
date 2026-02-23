import { Navigate, useLocation } from "react-router-dom";
import { getAuthUser } from "./Auth";

const defaultRedirect = {
  admin: "/admin-dashboard",
  official: "/official-dashboard",
  youth: "/dashboard",
};
const RequireRole = ({ allowedRoles, children }) => {
  const location = useLocation();
  const auth = getAuthUser();

  if (!auth) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  const userRole = auth.role;

  if (!allowedRoles.map((r) => r.toLowerCase()).includes(userRole)) {
    return <Navigate to={defaultRedirect[userRole] || "/"} replace />;
  }

  return children;
};

export default RequireRole;
