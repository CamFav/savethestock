import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type HowItWorksStepProps = {
  index: number;
  title: string;
  description: string;
};

export function HowItWorksStep({ index, title, description }: HowItWorksStepProps) {
  return (
    <Card className="h-full rounded-[28px] border-border/70 bg-white/80 shadow-[0_18px_40px_-28px_rgba(74,52,25,0.24)]">
      <CardHeader className="space-y-4 p-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#cdb497] bg-[#f6ebdd] text-sm font-semibold text-[#6f5333]">
            {index}
          </span>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8c7357]">Étape</p>
        </div>
        <CardTitle className="text-lg leading-tight tracking-[-0.03em] text-slate-950">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-0">
        <p className="text-sm leading-7 text-slate-600">{description}</p>
      </CardContent>
    </Card>
  );
}
