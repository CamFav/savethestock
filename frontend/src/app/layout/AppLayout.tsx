import {
  Settings2,
  LogOut,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useShallow } from "zustand/shallow";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useSessionStore } from "@/shared/auth/sessionStore";
import { getAppNavItems } from "@/shared/navigation/app-nav";

function getInitials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "ST";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function AppLayout() {
  const navigate = useNavigate();
  const { clearSession, displayName, role } = useSessionStore(
    useShallow((s) => ({
      clearSession: s.clearSession,
      displayName: s.displayName,
      role: s.role,
    })),
  );
  const navItems = getAppNavItems(role);

  function handleLogout() {
    clearSession();
    navigate("/login", { replace: true });
  }

  return (
    <SidebarProvider>
      <Sidebar variant="inset" className="border-r border-sidebar-border bg-sidebar">
        <SidebarHeader className="border-b border-sidebar-border pb-5 pt-6">
          <div className="px-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-sidebar-foreground/45">SaveTheStock</p>
            <p className="mt-2 text-lg font-semibold tracking-tight text-sidebar-foreground">Approvisionnement & stock</p>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup className="px-2 pt-4">
            <SidebarGroupLabel className="px-2 text-[11px] uppercase tracking-[0.18em] text-sidebar-foreground/45">Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.to}
                        className={({ isActive }) =>
                          [
                            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                            isActive
                              ? "bg-sidebar-primary text-sidebar-primary-foreground"
                              : "text-sidebar-foreground/78 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          ].join(" ")
                        }
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border px-4 py-4" />
      </Sidebar>

      <SidebarInset className="bg-background">
        <main className="min-h-screen p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex items-start justify-between gap-3">
            <SidebarTrigger className="md:hidden" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto h-auto rounded-full border-border bg-background px-2 py-1.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
                    {getInitials(displayName ?? "Stock Operator")}
                  </span>
                  <span className="ml-2 pr-2 text-left">
                    <span className="block text-xs font-semibold text-foreground">{displayName ?? "Utilisateur"}</span>
                  </span>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="pb-2 text-sm">{displayName ?? "Utilisateur"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="rounded-xl"
                  onSelect={(event) => {
                    event.preventDefault();
                    navigate("/app/account");
                  }}
                >
                  <Settings2 className="h-4 w-4" />
                  Paramètres du compte
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="rounded-xl"
                  onSelect={(event) => {
                    event.preventDefault();
                    handleLogout();
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
