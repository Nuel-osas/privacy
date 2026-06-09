import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/utils";
import { Loader2 } from "lucide-react";

type GlassButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "mint" | "violet" | "glass";
  size?: "sm" | "default" | "lg";
  loading?: boolean;
};

export function GlassButton({
  className,
  variant = "mint",
  size = "default",
  loading = false,
  disabled,
  children,
  ...props
}: GlassButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium",
        "transition-all duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        "active:scale-[0.98]",
        variant === "mint" && "tactile-mint",
        variant === "violet" && "tactile-violet",
        variant === "glass" && "tactile-glass",
        size === "sm" && "h-9 px-4 text-xs",
        size === "default" && "h-11 px-6 text-sm",
        size === "lg" && "h-14 px-8 text-base",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
