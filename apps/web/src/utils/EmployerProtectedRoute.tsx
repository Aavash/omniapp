import { useAuth } from "@/hooks/auth";
import { Outlet, Navigate } from "react-router-dom";

const EmployerProtectedRoutes = () => {
  const { userData } = useAuth();
  return userData?.is_owner ? <Outlet /> : <Navigate to="/" />;
};

export default EmployerProtectedRoutes;
