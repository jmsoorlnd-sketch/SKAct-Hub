import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getAuthUser } from "./Auth";
const RequireAuth = () => {
  const location = useLocation();
  const auth = getAuthUser();

  if (!auth) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default RequireAuth;
