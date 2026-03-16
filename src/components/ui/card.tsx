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
        "neu-surface rounded-[1.75rem] p-5 backdrop-blur md:p-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
