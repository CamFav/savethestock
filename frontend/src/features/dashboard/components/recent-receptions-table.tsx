import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ReceptionRow } from "@/features/dashboard/dashboard.mock";

type RecentReceptionsTableProps = {
  rows: ReceptionRow[];
};

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function statusClassName(status: ReceptionRow["status"]) {
  if (status === "validated") return "bg-emerald-50 text-emerald-700";
  if (status === "blocked") return "bg-rose-50 text-rose-700";
  return "bg-amber-50 text-amber-700";
}

export function RecentReceptionsTable({ rows }: RecentReceptionsTableProps) {
  const hasRows = rows.length > 0;

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="text-base">Recent receptions</CardTitle>
        <CardDescription>Track the latest inbound activity and validation status.</CardDescription>
      </CardHeader>
      <CardContent>
        {hasRows ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Lines</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} className="transition-colors duration-150">
                    <TableCell className="font-medium">{row.reference}</TableCell>
                    <TableCell>{row.supplier}</TableCell>
                    <TableCell>{row.lines}</TableCell>
                    <TableCell>{formatDate(row.receivedAt)}</TableCell>
                    <TableCell className="text-right">
                      <span className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${statusClassName(row.status)}`}>
                        {row.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-6">
            <p className="text-sm font-medium text-foreground">No receptions yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Start by creating suppliers and products, then log your first reception.
            </p>
            <Button asChild className="mt-4" size="sm" variant="outline">
              <Link to="/app/receptions">Open receptions</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
