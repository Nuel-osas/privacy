import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type GlassCardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "strong";
};

export function GlassCard({ className, variant = "default", ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        variant === "strong" ? "glass-surface-strong" : "glass-surface",
        "rounded-3xl",
        className,
      )}
      {...props}
    />
  );
}
