import { Navigate } from "react-router-dom";

export function NewWasteSessionPage() {
  return <Navigate to="/app/waste-sessions?create=1" replace />;
}
