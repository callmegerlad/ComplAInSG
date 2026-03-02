import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/app/providers/AuthProvider";

function FullScreenStatus({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-6 text-center text-sm text-text-secondary">
      {label}
    </div>
  );
}

export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <FullScreenStatus label="Restoring your session..." />;
  }

  if (status !== "authenticated") {
    const redirectTo = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/auth?redirect=${encodeURIComponent(redirectTo)}`} replace />;
  }

  return <Outlet />;
}

export function PublicOnlyAuthRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <FullScreenStatus label="Checking your session..." />;
  }

  if (status === "authenticated") {
    const params = new URLSearchParams(location.search);
    const redirectTo = params.get("redirect") || "/";
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}