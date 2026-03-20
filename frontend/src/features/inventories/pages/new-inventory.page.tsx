import { Navigate } from "react-router-dom";

export function NewInventoryPage() {
  return <Navigate to="/app/inventories?create=1" replace />;
}
