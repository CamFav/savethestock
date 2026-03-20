import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MetricValueProps = {
  children: ReactNode;
  placeholder?: boolean;
  size?: "md" | "lg" | "xl";
  className?: string;
};

const sizeClasses: Record<NonNullable<MetricValueProps["size"]>, string> = {
  md: "text-xl",
  lg: "text-2xl",
  xl: "text-3xl",
};

export function MetricValue({ children, placeholder = false, size = "lg", className }: MetricValueProps) {
  return (
    <p
      className={cn(
        "mt-2",
        placeholder
          ? "text-sm font-medium tracking-normal text-muted-foreground"
          : `font-semibold tracking-[-0.04em] text-foreground ${sizeClasses[size]}`,
        className,
      )}
    >
      {children}
    </p>
  );
}
