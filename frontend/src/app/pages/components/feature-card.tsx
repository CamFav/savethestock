import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type FeatureCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function FeatureCard({ title, description, icon: Icon }: FeatureCardProps) {
  return (
    <Card className="group h-full overflow-hidden rounded-[28px] border-border/70 bg-white/85 shadow-[0_18px_40px_-28px_rgba(74,52,25,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#bfa178]/60">
      <CardHeader className="space-y-4 p-6">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#d7c5ae] bg-[#f8efe3] text-[#5f4427]">
          <Icon aria-hidden="true" className="h-5 w-5" />
        </span>
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8c7357]">Bénéfice</p>
          <CardTitle className="text-lg leading-tight tracking-[-0.03em] text-slate-950">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-0">
        <CardDescription className="text-sm leading-7 text-slate-600">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}
