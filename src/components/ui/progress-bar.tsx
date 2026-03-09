import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className
}: {
  value: number;
  className?: string;
}) {
  return (
    <div className={cn("h-3 w-full rounded-full bg-slate-100", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-surge via-sky to-glow transition-all duration-500"
        style={{ width: `${Math.max(6, Math.min(value, 100))}%` }}
      />
    </div>
  );
}
