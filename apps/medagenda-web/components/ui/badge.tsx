import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "success" | "warning" | "destructive" | "muted";

const variants: Record<Variant, string> = {
  default: "bg-secondary text-secondary-foreground",
  success: "bg-accent-soft text-accent",
  warning: "bg-warning-soft text-warning",
  destructive: "bg-destructive-soft text-destructive",
  muted: "bg-muted text-muted-foreground",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
