import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { hasPermission, normalizeRole, ROLES } from "@/common/utils/permissions";

interface RequirePermissionProps {
  permission: string;
}

export default function RequirePermission({ permission }: RequirePermissionProps) {
  const { user } = useAuth();

  if (!hasPermission(user?.role, permission)) {
    const basePath =
      normalizeRole(user?.role) === ROLES.INTERVIEWER ? "/interviewer" : "/admin";
    return <Navigate to={`${basePath}/dashboard`} replace />;
  }

  return <Outlet />;
}
