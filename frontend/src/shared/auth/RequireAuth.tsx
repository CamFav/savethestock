import { Navigate, Outlet } from "react-router-dom";
import { useSessionStore } from "@/shared/auth/sessionStore";

export function RequireAuth() {
  const token = useSessionStore((s) => s.jwtToken);
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}