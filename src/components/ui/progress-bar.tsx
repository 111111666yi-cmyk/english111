import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className
}: {
  value: number;
  className?: string;
}) {
  const safeValue = Math.max(6, Math.min(value, 100));

  return (
    <div className={cn("neu-inset h-3.5 w-full overflow-hidden rounded-full p-0.5", className)}>
      <div
        className="h-full rounded-full bg-[linear-gradient(135deg,#7dd4ff_0%,#6877f8_55%,#b0d98f_100%)] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.38),0_4px_10px_rgba(92,124,255,0.22)] transition-all duration-500"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
