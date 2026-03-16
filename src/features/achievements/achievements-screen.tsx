"use client";

import { useMemo } from "react";
import { AchievementPanel } from "@/components/achievement-panel";
import { Shell } from "@/components/shell";
import { Card } from "@/components/ui/card";
import { buildAchievements } from "@/lib/achievements";
import { useAuthStore } from "@/stores/auth-store";
import { useLearningStore } from "@/stores/learning-store";

export function AchievementsScreen() {
  const currentUsername = useAuthStore((state) => state.currentUsername);
  const knownWords = useLearningStore((state) => state.knownWords.length);
  const completedSentences = useLearningStore((state) => state.completedSentenceIds.length);
  const completedPassages = useLearningStore((state) => state.completedPassageIds.length);
  const streakDays = useLearningStore((state) => state.streakDays);
  const reviewMistakes = useLearningStore((state) => state.reviewMistakes.length);
  const examLevelProgress = useLearningStore((state) => state.examLevelProgress);
  const activeMode = useLearningStore((state) => state.modeConfig.activeMode);

  const [badgeItems, milestoneItems, challengeItems] = useMemo(() => {
    const items = buildAchievements({
      knownWords,
      completedSentences,
      completedPassages,
      streakDays,
      reviewMistakes,
      examLevelProgress
    });

    return [items.slice(0, 3), items.slice(3, 6), items.slice(6, 9)];
  }, [
    completedPassages,
    completedSentences,
    examLevelProgress,
    knownWords,
    reviewMistakes,
    streakDays
  ]);

  return (
    <Shell>
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-surge">Achievements</p>
          <h2 className="text-4xl font-black text-ink">成就中心</h2>
          <p className="text-sm text-slate-500">
            当前账号：{currentUsername ?? "游客模式"}，当前模式：
            {activeMode === "simple" ? "简单模式" : "困难模式"}。
          </p>
        </div>

        <Card className="space-y-4">
          <h2 className="text-xl font-black text-ink">勋章</h2>
          <AchievementPanel items={badgeItems} />
        </Card>

        <Card className="space-y-4">
          <h2 className="text-xl font-black text-ink">里程碑</h2>
          <AchievementPanel items={milestoneItems} />
        </Card>

        <Card className="space-y-4">
          <h2 className="text-xl font-black text-ink">连续学习 / 闯关 / 模式成就</h2>
          <AchievementPanel items={challengeItems} />
        </Card>
      </div>
    </Shell>
  );
}
