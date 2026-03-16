import dynamic from "next/dynamic";

const AchievementsScreen = dynamic(
  () => import("@/features/achievements/achievements-screen").then((mod) => mod.AchievementsScreen),
  {
    loading: () => <div className="px-4 py-10 text-sm text-slate-500">Loading achievements...</div>
  }
);

export default function AchievementsPage() {
  return <AchievementsScreen />;
}
