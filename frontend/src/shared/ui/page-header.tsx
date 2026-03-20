import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  compact?: boolean;
  className?: string;
};

export function PageHeader({ title, description, actions, compact = false, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        compact ? "gap-3" : "gap-4",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className={cn(compact ? "text-xl font-semibold tracking-tight" : "text-2xl font-semibold tracking-tight")}>
          {title}
        </h1>
        {description ? <p className="max-w-3xl text-sm text-muted-foreground">{description}</p> : null}
      </div>

      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
