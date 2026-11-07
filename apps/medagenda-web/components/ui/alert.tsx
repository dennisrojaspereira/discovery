import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ErrorAlert({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <div
      className={cn(
        "rounded-md border border-destructive/30 bg-destructive-soft px-3 py-2 text-sm text-destructive",
      )}
      role="alert"
    >
      {children}
    </div>
  );
}

export function SuccessAlert({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <div className="rounded-md border border-accent/30 bg-accent-soft px-3 py-2 text-sm text-accent">
      {children}
    </div>
  );
}
