import { Badge } from "@/components/ui/badge";

const colorMap = {
  L1: "bg-emerald-100 text-emerald-700",
  L2: "bg-cyan-100 text-cyan-700",
  L3: "bg-blue-100 text-blue-700",
  L4: "bg-violet-100 text-violet-700",
  L5: "bg-amber-100 text-amber-700"
};

export function DifficultyBadge({ level }: { level: keyof typeof colorMap }) {
  return <Badge className={colorMap[level]}>{level}</Badge>;
}
