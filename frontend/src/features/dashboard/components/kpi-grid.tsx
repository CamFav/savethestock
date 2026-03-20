import { KpiCard } from "@/features/dashboard/components/kpi-card";
import type { DashboardKpi } from "@/features/dashboard/dashboard.mock";

type KpiGridProps = {
  items: DashboardKpi[];
};

export function KpiGrid({ items }: KpiGridProps) {
  return (
    <section className="space-y-3">
      <header>
        <h2 className="text-base font-semibold tracking-tight text-foreground">Performance snapshot</h2>
      </header>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <KpiCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
