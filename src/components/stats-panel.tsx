import { Card } from "@/components/ui/card";

export function StatsPanel({
  items
}: {
  items: { label: string; value: string; hint: string }[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label} className="space-y-2">
          <p className="text-sm font-medium text-slate-500">{item.label}</p>
          <p className="text-3xl font-bold text-ink">{item.value}</p>
          <p className="neu-inset rounded-2xl px-3 py-2 text-sm text-slate-500">{item.hint}</p>
        </Card>
      ))}
    </div>
  );
}
