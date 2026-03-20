import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardKpi } from "@/features/dashboard/dashboard.mock";

type KpiCardProps = {
  item: DashboardKpi;
};

function getTrendIcon(direction: DashboardKpi["trend"]["direction"]) {
  if (direction === "up") return ArrowUpRight;
  if (direction === "down") return ArrowDownRight;
  return ArrowRight;
}

function getTrendClassName(direction: DashboardKpi["trend"]["direction"]) {
  if (direction === "up") return "text-emerald-700 bg-emerald-50";
  if (direction === "down") return "text-rose-700 bg-rose-50";
  return "text-slate-700 bg-slate-100";
}

export function KpiCard({ item }: KpiCardProps) {
  const TrendIcon = getTrendIcon(item.trend.direction);
  const trendClassName = getTrendClassName(item.trend.direction);

  return (
    <Card className="border-border/70 transition-colors duration-150 hover:border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-2xl font-semibold tracking-tight text-foreground">{item.value}</p>
        <p className="text-xs text-muted-foreground">{item.hint}</p>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${trendClassName}`}>
            <TrendIcon className="h-3.5 w-3.5" />
            {item.trend.value}
          </span>
          <span className="text-xs text-muted-foreground">{item.trend.label}</span>
        </div>
      </CardContent>
    </Card>
  );
}
