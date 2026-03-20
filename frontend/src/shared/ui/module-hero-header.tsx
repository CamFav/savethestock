import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { MetricValue } from "@/shared/ui/metric-value";

type ModuleHeroStat = {
  label: string;
  value: ReactNode;
  help: string;
  placeholder?: boolean;
};

type ModuleHeroHeaderProps = {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  actions?: ReactNode;
  stats?: ModuleHeroStat[];
  tone?: "catalog" | "orders" | "suppliers" | "inventories" | "waste" | "today";
  compact?: boolean;
  className?: string;
};

const toneClasses: Record<NonNullable<ModuleHeroHeaderProps["tone"]>, { shell: string; overlay: string; card: string }> = {
  catalog: {
    shell: "border-border/70 bg-[#e7f1e6] text-slate-950 shadow-[0_24px_70px_-48px_rgba(78,104,72,0.34)]",
    overlay: "bg-[radial-gradient(circle_at_top_right,rgba(93,133,77,0.10),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(124,98,49,0.06),transparent_28%)]",
    card: "border-border/70 bg-white/84 text-slate-950",
  },
  orders: {
    shell: "border-border/70 bg-[linear-gradient(135deg,#f7f2ea_0%,#fffdf9_55%,#ece3d6_100%)] text-slate-950 shadow-[0_24px_70px_-48px_rgba(123,93,54,0.45)]",
    overlay: "bg-[radial-gradient(circle_at_top_right,rgba(120,96,59,0.08),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(164,132,92,0.06),transparent_28%)]",
    card: "border-border/70 bg-white/85 text-slate-950",
  },
  suppliers: {
    shell: "border-border/70 bg-[linear-gradient(135deg,#f6efe5_0%,#fffaf2_55%,#ebe3d0_100%)] text-slate-950 shadow-[0_24px_70px_-48px_rgba(123,93,54,0.42)]",
    overlay: "bg-[radial-gradient(circle_at_top_right,rgba(123,63,0,0.08),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(65,45,8,0.06),transparent_28%)]",
    card: "border-border/70 bg-white/80 text-slate-950",
  },
  inventories: {
    shell: "border-border/70 bg-[linear-gradient(135deg,#e9f0f7_0%,#f9fbfd_52%,#dce8f3_100%)] text-slate-950 shadow-[0_24px_70px_-48px_rgba(64,98,130,0.38)]",
    overlay: "bg-[radial-gradient(circle_at_top_right,rgba(67,112,156,0.10),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(112,148,183,0.08),transparent_28%)]",
    card: "border-border/70 bg-white/82 text-slate-950",
  },
  waste: {
    shell: "border-border/70 bg-[linear-gradient(135deg,#f8ece9_0%,#fff8f6_55%,#f2ded9_100%)] text-slate-950 shadow-[0_24px_70px_-48px_rgba(149,76,61,0.34)]",
    overlay: "bg-[radial-gradient(circle_at_top_right,rgba(179,78,50,0.10),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(138,49,25,0.06),transparent_28%)]",
    card: "border-border/70 bg-white/84 text-slate-950",
  },
  today: {
    shell: "border-border/70 bg-[linear-gradient(135deg,#eef4ea_0%,#fffdf8_52%,#dde8d5_100%)] text-slate-950 shadow-[0_24px_70px_-48px_rgba(78,104,72,0.34)]",
    overlay: "bg-[radial-gradient(circle_at_top_right,rgba(93,133,77,0.10),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(124,98,49,0.06),transparent_28%)]",
    card: "border-border/70 bg-white/84 text-slate-950",
  },
};

export function ModuleHeroHeader({
  eyebrow,
  title,
  description,
  actions,
  stats = [],
  tone = "orders",
  compact = false,
  className,
}: ModuleHeroHeaderProps) {
  const palette = toneClasses[tone];
  const statsGridClass =
    stats.length >= 4
      ? "sm:grid-cols-2 xl:grid-cols-2"
      : stats.length === 3
        ? "sm:grid-cols-3"
        : stats.length === 2
          ? "sm:grid-cols-2"
          : "grid-cols-1";

  return (
    <section className={cn("page-hero relative overflow-hidden", palette.shell, className)}>
      <div className={cn("absolute inset-0", palette.overlay)} />
      <div className={cn("relative grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end", compact ? "gap-4" : "gap-6")}>
        <div className={cn(compact ? "space-y-3" : "space-y-4")}>
          <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-slate-700/70">{eyebrow}</p>
          <div className="space-y-3">
            <h1 className={cn("max-w-3xl font-semibold tracking-[-0.05em]", compact ? "text-3xl sm:text-[2.15rem]" : "text-4xl sm:text-[2.75rem]")}>{title}</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-700">{description}</p>
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>

        {stats.length > 0 ? (
          <div className={cn("grid gap-3", statsGridClass)}>
            {stats.map((stat) => (
              <div key={stat.label} className={cn("rounded-[24px] border p-4", palette.card)}>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{stat.label}</p>
                <MetricValue size="xl" placeholder={stat.placeholder} className="mt-3">
                  {stat.value}
                </MetricValue>
                <p className="mt-2 text-sm text-muted-foreground">{stat.help}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
