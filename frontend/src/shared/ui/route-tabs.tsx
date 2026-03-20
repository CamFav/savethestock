import type { LucideIcon } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

export type RouteTabItem = {
  label: string;
  to: string;
  icon?: LucideIcon;
};

type RouteTabsProps = {
  items: RouteTabItem[];
  className?: string;
};

export function RouteTabs({ items, className }: RouteTabsProps) {
  return (
    <div className={cn(className)}>
      <nav className="grid grid-cols-1 gap-2 sm:grid-cols-3" aria-label="Navigation interne">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-border bg-background text-foreground shadow-sm"
                  : "border-transparent bg-transparent text-muted-foreground hover:border-border/60 hover:bg-background/70 hover:text-foreground",
              )
            }
          >
            {item.icon ? <item.icon className="h-4 w-4" /> : null}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
