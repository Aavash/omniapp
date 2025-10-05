import { useAuth } from "@/hooks/auth";
import { Outlet, Navigate } from "react-router-dom";

const EmployeeProtectedRoutes = () => {
  const { userData } = useAuth();
  return userData?.is_employee ? <Outlet /> : <Navigate to="/" />;
};

export default EmployeeProtectedRoutes;
