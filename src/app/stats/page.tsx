import dynamic from "next/dynamic";

const StatsScreen = dynamic(
  () => import("@/features/stats/stats-screen").then((mod) => mod.StatsScreen),
  {
    loading: () => <div className="px-4 py-10 text-sm text-slate-500">Loading stats...</div>
  }
);

export default function StatsPage() {
  return <StatsScreen />;
}
