import { CheckCircle2, Circle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SetupTask } from "@/features/dashboard/dashboard.mock";

type SetupChecklistCardProps = {
  tasks: SetupTask[];
};

function taskLink(taskId: SetupTask["id"]) {
  if (taskId === "categories") return "/app/categories";
  if (taskId === "suppliers") return "/app/suppliers";
  return "/app/products";
}

export function SetupChecklistCard({ tasks }: SetupChecklistCardProps) {
  const completedCount = tasks.filter((task) => task.done).length;

  return (
    <Card className="border-border/70">
      <CardHeader>
        <CardTitle className="text-base">Setup assistant</CardTitle>
        <CardDescription>
          Complete {completedCount}/{tasks.length} steps to unlock a fully operational dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="rounded-md border p-3 transition-colors duration-150 hover:border-border">
            <div className="flex items-start gap-2">
              {task.done ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 text-muted-foreground" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{task.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{task.description}</p>
                {!task.done && (
                  <Button asChild className="mt-3" size="sm" variant="outline">
                    <Link to={taskLink(task.id)}>{task.ctaLabel}</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
