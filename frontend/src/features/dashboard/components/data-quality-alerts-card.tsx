import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DataQualityAlert } from "@/features/dashboard/dashboard.mock";

type DataQualityAlertsCardProps = {
  alerts: DataQualityAlert[];
};

function severityClassName(severity: DataQualityAlert["severity"]) {
  if (severity === "high") return "bg-rose-50 text-rose-700";
  if (severity === "medium") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

export function DataQualityAlertsCard({ alerts }: DataQualityAlertsCardProps) {
  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="text-base">Data quality alerts</CardTitle>
        <CardDescription>Resolve anomalies before they impact stock decisions.</CardDescription>
      </CardHeader>
      <CardContent>
        {alerts.length > 0 ? (
          <ul className="space-y-3">
            {alerts.map((alert) => (
              <li key={alert.id} className="rounded-md border p-3 transition-colors duration-150 hover:border-border">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{alert.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{alert.description}</p>
                  </div>
                  <span className={`rounded-md px-2 py-1 text-xs font-medium ${severityClassName(alert.severity)}`}>
                    {alert.severity}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-md border border-dashed p-6">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-foreground">No active alerts</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Great baseline. Keep onboarding products and receptions to activate quality monitoring.
                </p>
                <Button asChild className="mt-4" size="sm" variant="outline">
                  <Link to="/app/lots">Review lots</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
