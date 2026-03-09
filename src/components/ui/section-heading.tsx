import { Badge } from "@/components/ui/badge";

export function SectionHeading({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-3">
      <Badge className="bg-sky/15 text-surge">{eyebrow}</Badge>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">
          {title}
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
          {description}
        </p>
      </div>
    </div>
  );
}
