import dynamic from "next/dynamic";
import { examWorlds } from "@/lib/challenge-data";

const ChallengeLevelScreen = dynamic(
  () =>
    import("@/features/challenge/challenge-level-screen").then((mod) => mod.ChallengeLevelScreen),
  {
    loading: () => <div className="px-4 py-10 text-sm text-slate-500">Loading challenge level...</div>
  }
);

export function generateStaticParams() {
  return examWorlds.flatMap((world) => world.levels.map((level) => ({ levelId: level.id })));
}

export default async function ChallengeLevelPage({
  params
}: {
  params: Promise<{ levelId: string }>;
}) {
  const { levelId } = await params;
  return <ChallengeLevelScreen levelId={levelId} />;
}
