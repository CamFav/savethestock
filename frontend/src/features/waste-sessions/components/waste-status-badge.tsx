import { cn } from "@/lib/utils";

type WasteStatusBadgeProps = {
  status?: string;
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "border-amber-300 bg-amber-50 text-amber-800",
  POSTED: "border-emerald-300 bg-emerald-50 text-emerald-800",
  CANCELLED: "border-slate-300 bg-slate-50 text-slate-700",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Brouillon",
  POSTED: "Validé",
  CANCELLED: "Annulé",
};

export function WasteStatusBadge({ status }: WasteStatusBadgeProps) {
  const normalized = (status ?? "DRAFT").toUpperCase();

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
        STATUS_STYLE[normalized] ?? "border-slate-300 bg-slate-50 text-slate-700",
      )}
    >
      {STATUS_LABEL[normalized] ?? normalized}
    </span>
  );
}
