import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "@/common/ui/Spinner";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <Spinner className="h-12 w-12 border-t-2 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!user) {
    const redirectUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectUrl}`} replace />;
  }

  return <Outlet />;
}
