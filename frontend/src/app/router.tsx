import { Suspense, lazy, type ReactNode } from "react";
import { createBrowserRouter, Navigate, useLocation } from "react-router-dom";
import { RouteFallback } from "@/app/components/route-fallback";
import { AppLayout } from "@/app/layout/AppLayout";
import { CatalogPage } from "@/app/pages/catalog.page";
import { LandingPage } from "@/app/pages/landing.page";
import { SettingsPage } from "@/app/pages/settings.page";
import { RequireAuth } from "@/shared/auth/RequireAuth";
import { RequireRole } from "@/shared/auth/RequireRole";
import { isOwnerRole } from "@/shared/auth/roles";
import { useSessionStore } from "@/shared/auth/sessionStore";
import { InvitePage } from "@/features/invitations/pages/invite.page";
import { LoginPage } from "@/features/auth/login.page";
import { RegisterPage } from "@/features/auth/register.page";
import { AccountsPage } from "@/features/accounts/accounts.page";
import { AccountSettingsPage } from "@/features/accounts/pages/account-settings.page";

const TodayPage = lazy(() => import("@/features/operational/today.page").then((module) => ({ default: module.TodayPage })));
const ReceptionDetailPage = lazy(() =>
  import("@/features/receptions/pages/reception-detail.page").then((module) => ({ default: module.ReceptionDetailPage })),
);
const ProductDetailPage = lazy(() =>
  import("@/features/products/pages/product-detail.page").then((module) => ({ default: module.ProductDetailPage })),
);
const OrdersPage = lazy(() => import("@/features/orders/orders.page").then((module) => ({ default: module.OrdersPage })));
const OrderDetailPage = lazy(() =>
  import("@/features/orders/pages/order-detail.page").then((module) => ({ default: module.OrderDetailPage })),
);
const InventoriesPage = lazy(() => import("@/features/inventories/inventories.page").then((module) => ({ default: module.InventoriesPage })));
const InventoryDetailPage = lazy(() =>
  import("@/features/inventories/pages/inventory-detail.page").then((module) => ({ default: module.InventoryDetailPage })),
);
const WasteSessionsPage = lazy(() =>
  import("@/features/waste-sessions/waste-sessions.page").then((module) => ({ default: module.WasteSessionsPage })),
);
const WasteSessionDetailPage = lazy(() =>
  import("@/features/waste-sessions/pages/waste-session-detail.page").then((module) => ({ default: module.WasteSessionDetailPage })),
);
const CategoriesPage = lazy(() =>
  import("@/features/categories/categories.page").then((module) => ({ default: module.CategoriesPage })),
);
const SuppliersPage = lazy(() => import("@/features/suppliers/suppliers.page").then((module) => ({ default: module.SuppliersPage })));
const AnalysesPage = lazy(() => import("@/features/dashboard/analyses.page").then((module) => ({ default: module.AnalysesPage })));

function withRouteFallback(node: ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{node}</Suspense>;
}

function LegacyDashboardRedirect() {
  const role = useSessionStore((s) => s.role);
  return <Navigate to={isOwnerRole(role) ? "/app/analyses" : "/app/today"} replace />;
}

function LegacyStockRedirect() {
  const location = useLocation();
  return <Navigate to={{ pathname: "/app/catalog", search: location.search }} replace />;
}

function LegacyReceptionsRedirect() {
  const location = useLocation();
  return <Navigate to={{ pathname: "/app/orders", search: location.search }} replace />;
}

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },
  { path: "/invite/:token", element: <InvitePage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    path: "/app",
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <Navigate to="today" replace /> },
          { path: "today", element: withRouteFallback(<TodayPage />) },
          { path: "account", element: <AccountSettingsPage /> },
          { path: "dashboard", element: <LegacyDashboardRedirect /> },
          { path: "stock", element: <LegacyStockRedirect /> },
          { path: "orders", element: withRouteFallback(<OrdersPage />) },
          { path: "orders/:orderId", element: withRouteFallback(<OrderDetailPage />) },
          { path: "receptions", element: <LegacyReceptionsRedirect /> },
          { path: "receptions/:id", element: withRouteFallback(<ReceptionDetailPage />) },
          { path: "lots", element: <LegacyStockRedirect /> },
          { path: "waste-sessions", element: withRouteFallback(<WasteSessionsPage />) },
          { path: "waste-sessions/new", element: <Navigate to="/app/waste-sessions?create=1" replace /> },
          { path: "waste-sessions/:id", element: withRouteFallback(<WasteSessionDetailPage />) },
          { path: "inventories", element: withRouteFallback(<InventoriesPage />) },
          { path: "inventories/new", element: <Navigate to="/app/inventories?create=1" replace /> },
          { path: "inventories/:id", element: withRouteFallback(<InventoryDetailPage />) },
          { path: "catalog", element: <CatalogPage /> },
          { path: "catalog/:productId", element: withRouteFallback(<ProductDetailPage />) },
          { path: "catalog/products", element: <Navigate to="/app/catalog" replace /> },
          { path: "catalog/categories", element: <Navigate to="/app/categories" replace /> },
          { path: "catalog/suppliers", element: <Navigate to="/app/suppliers" replace /> },
          { path: "products/:id", element: <Navigate to="/app/catalog" replace /> },
          { path: "products", element: <Navigate to="/app/catalog" replace /> },
          { path: "categories", element: withRouteFallback(<CategoriesPage />) },
          { path: "suppliers", element: withRouteFallback(<SuppliersPage />) },
          {
            element: <RequireRole allowedRoles={["OWNER"]} />,
            children: [
              { path: "analyses", element: withRouteFallback(<AnalysesPage />) },
              {
                path: "settings",
                element: <SettingsPage />,
                children: [
                  { index: true, element: <Navigate to="members" replace /> },
                  { path: "members", element: <AccountsPage /> },
                  { path: "users", element: <Navigate to="/app/settings/members" replace /> },
                ],
              },
            ],
          },
          { path: "settings/suppliers", element: <Navigate to="/app/suppliers" replace /> },
          { path: "accounts", element: <Navigate to="/app/settings/members" replace /> },
        ],
      },
    ],
  },
]);
