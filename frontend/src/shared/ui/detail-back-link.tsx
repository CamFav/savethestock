import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DetailBackLinkProps = {
  to: string;
  label: string;
  className?: string;
};

export function DetailBackLink({ to, label, className }: DetailBackLinkProps) {
  return (
    <Button asChild variant="outline" className={cn(className)}>
      <Link to={to}>
        <ArrowLeft className="h-4 w-4" />
        {label}
      </Link>
    </Button>
  );
}
