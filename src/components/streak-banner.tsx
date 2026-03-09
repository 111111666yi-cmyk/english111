import { Flame, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

export function StreakBanner({
  streakDays,
  weeklyMinutes
}: {
  streakDays: number;
  weeklyMinutes: number;
}) {
  return (
    <Card className="grid gap-5 overflow-hidden bg-gradient-to-br from-surge via-sky to-[#8ce8ff] text-white md:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
          <Sparkles className="h-4 w-4" />
          Today&apos;s Path
        </div>
        <div>
          <h1 className="max-w-2xl text-4xl font-black leading-tight md:text-6xl">
            从 3500 词到自然理解句子和短文。
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/90 md:text-base">
            English Climb 以本地题库、双语互动和轻游戏化进度，让你每天稳定前进，不依赖运行期大模型。
          </p>
        </div>
      </div>
      <div className="grid gap-4 self-end md:justify-items-end">
        <div className="rounded-4xl bg-white/18 p-5 backdrop-blur">
          <p className="text-sm uppercase tracking-[0.24em] text-white/75">连续学习</p>
          <p className="mt-3 flex items-center gap-2 text-4xl font-black">
            <Flame className="h-8 w-8" />
            {streakDays} 天
          </p>
        </div>
        <div className="rounded-4xl bg-white/18 p-5 backdrop-blur">
          <p className="text-sm uppercase tracking-[0.24em] text-white/75">本周投入</p>
          <p className="mt-3 text-3xl font-black">{weeklyMinutes} 分钟</p>
        </div>
      </div>
    </Card>
  );
}
