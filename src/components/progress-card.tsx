import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";

export function ProgressCard({
  title,
  value,
  detail
}: {
  title: string;
  value: number;
  detail: string;
}) {
  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-600">{title}</p>
        <span className="text-lg font-bold text-ink">{value}%</span>
      </div>
      <ProgressBar value={value} />
      <p className="neu-inset rounded-2xl px-3 py-2 text-sm text-slate-500">{detail}</p>
    </Card>
  );
}
