import { Navigate, Outlet, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useEffect } from "react";
import { useSessionStore } from "@/shared/auth/sessionStore";
import { normalizeRole, type AppRole } from "@/shared/auth/roles";

type RequireRoleProps = {
  allowedRoles: AppRole[];
  redirectTo?: string;
};

export function RequireRole({ allowedRoles, redirectTo = "/app/today" }: RequireRoleProps) {
  const location = useLocation();
  const role = useSessionStore((s) => normalizeRole(s.role));
  const isAllowed = !!role && allowedRoles.includes(role);

  useEffect(() => {
    if (!isAllowed) {
      toast.error("Cette page est reservee au proprietaire.");
    }
  }, [isAllowed, location.pathname]);

  if (!isAllowed) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return <Outlet />;
}
