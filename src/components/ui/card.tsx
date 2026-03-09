import type { HTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={cn(
        "rounded-4xl border border-white/70 bg-white/75 p-6 shadow-soft backdrop-blur",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
