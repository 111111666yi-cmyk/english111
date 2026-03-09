import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  className
}: PropsWithChildren<{ className?: string }>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600",
        className
      )}
    >
      {children}
    </span>
  );
}
