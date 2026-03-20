import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SectionCardProps = {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  titleClassName?: string;
};

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  headerClassName,
  contentClassName,
  titleClassName,
}: SectionCardProps) {
  return (
    <Card className={cn("panel-muted", className)}>
      {title || description || actions ? (
        <CardHeader className={cn("space-y-4", headerClassName)}>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              {title ? <CardTitle className={cn("text-base", titleClassName)}>{title}</CardTitle> : null}
              {description ? <CardDescription>{description}</CardDescription> : null}
            </div>
            {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
          </div>
        </CardHeader>
      ) : null}

      <CardContent className={cn("space-y-4", contentClassName)}>{children}</CardContent>
    </Card>
  );
}
