import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  className
}: PropsWithChildren<{ className?: string }>) {
  return (
    <span
      className={cn(
        "neu-chip inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-slate-600",
        className
      )}
    >
      {children}
    </span>
  );
}
