import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyStateCardProps = {
  title: string;
  description: string;
  ctaLabel: string;
  onCtaClick: () => void;
  ctaDisabled?: boolean;
  hint?: string;
};

export function EmptyStateCard({ title, description, ctaLabel, onCtaClick, ctaDisabled = false, hint }: EmptyStateCardProps) {
  return (
    <div className="flex flex-col items-center rounded-[24px] border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background">
        <Sparkles className="h-4 w-4 text-foreground" />
      </div>
      <p className="text-base font-semibold text-foreground">{title}</p>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      <Button className="mt-5" disabled={ctaDisabled} onClick={onCtaClick}>
        {ctaLabel}
      </Button>
      {hint ? <p className="mt-4 max-w-sm text-xs leading-5 text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
