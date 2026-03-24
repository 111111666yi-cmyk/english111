"use client";

import { useEffect, useMemo, useState } from "react";
import { Coins, Gift, Trophy } from "lucide-react";
import { AchievementPanel } from "@/components/achievement-panel";
import { ResultToast } from "@/components/result-toast";
import { Shell } from "@/components/shell";
import { Card } from "@/components/ui/card";
import {
  ACHIEVEMENT_CATEGORY_META,
  ACHIEVEMENT_TOTAL,
  type AchievementCategory,
  type AchievementItem,
  buildAchievements
} from "@/lib/achievements";
import { countReleaseWordIds } from "@/lib/content";
import { useAuthStore } from "@/stores/auth-store";
import { useLearningStore } from "@/stores/learning-store";

const categoryOrder: AchievementCategory[] = [
  "vocabulary",
  "sentences",
  "reading",
  "streak",
  "challenge",
  "review"
];

type FeedbackState = { text: string; positive: boolean };

export function AchievementsScreen() {
  const currentUsername = useAuthStore((state) => state.currentUsername);
  const knownWords = useLearningStore((state) => countReleaseWordIds(state.knownWords));
  const completedSentences = useLearningStore((state) => state.completedSentenceIds.length);
  const completedPassages = useLearningStore((state) => state.completedPassageIds.length);
  const streakDays = useLearningStore((state) => state.streakDays);
  const reviewMistakes = useLearningStore((state) => state.reviewMistakes.length);
  const examLevelProgress = useLearningStore((state) => state.examLevelProgress);
  const activeMode = useLearningStore((state) => state.modeConfig.activeMode);
  const claimedAchievementRewardIds = useLearningStore(
    (state) => state.userConfig.claimedAchievementRewardIds
  );
  const starlight = useLearningStore((state) => state.commerce.starlight);
  const claimAchievementReward = useLearningStore((state) => state.claimAchievementReward);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timer = window.setTimeout(() => setFeedback(null), 2200);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const achievements = useMemo(
    () =>
      buildAchievements({
        knownWords,
        completedSentences,
        completedPassages,
        streakDays,
        reviewMistakes,
        examLevelProgress,
        claimedAchievementRewardIds
      }),
    [
      claimedAchievementRewardIds,
      completedPassages,
      completedSentences,
      examLevelProgress,
      knownWords,
      reviewMistakes,
      streakDays
    ]
  );

  const unlockedCount = achievements.filter((item) => item.unlocked).length;
  const claimedCount = achievements.filter((item) => item.claimed).length;
  const nextRewardTotal = achievements
    .filter((item) => item.unlocked && !item.claimed)
    .reduce((total, item) => total + item.reward, 0);
  const groupedAchievements = categoryOrder.map((category) => ({
    category,
    meta: ACHIEVEMENT_CATEGORY_META[category],
    items: achievements.filter((item) => item.category === category)
  }));

  const pushFeedback = (text: string, positive = true) => setFeedback({ text, positive });

  const handleClaim = (item: AchievementItem) => {
    if (!item.unlocked) {
      pushFeedback("先解锁这个成就，再打开宝箱。", false);
      return;
    }

    if (item.claimed) {
      pushFeedback("这个宝箱已经打开过了。", false);
      return;
    }

    const result = claimAchievementReward(item.id, item.reward, item.title);
    pushFeedback(result.message, result.ok);
  };

  return (
    <Shell>
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-surge">Achievements</p>
          <h2 className="text-4xl font-black text-ink">成就中心</h2>
          <p className="text-sm text-slate-500">
            当前账号：{currentUsername ?? "游客模式"}，当前模式：
            {activeMode === "simple" ? "简单模式" : "困难模式"}。
          </p>
        </div>

        <Card className="overflow-hidden rounded-[2rem] p-0">
          <div className="grid gap-3 bg-[linear-gradient(135deg,rgba(254,243,199,0.42),rgba(255,255,255,0.95),rgba(191,219,254,0.3))] px-4 py-4 md:grid-cols-[1.1fr_0.9fr] md:px-5">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[1.4rem] bg-amber-100 text-amber-700">
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-lg font-black text-ink">50 个成就宝箱已经接入</p>
                  <p className="text-sm text-slate-500">
                    每个解锁成就都能打开一次小宝箱，领取 5 到 10 星芒。
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.3rem] bg-white/82 px-4 py-3 shadow-soft">
                  <p className="text-sm text-slate-500">已解锁</p>
                  <p className="mt-1 text-2xl font-black text-ink">
                    {unlockedCount}
                    <span className="text-base text-slate-400"> / {ACHIEVEMENT_TOTAL}</span>
                  </p>
                </div>
                <div className="rounded-[1.3rem] bg-white/82 px-4 py-3 shadow-soft">
                  <p className="text-sm text-slate-500">已开宝箱</p>
                  <p className="mt-1 text-2xl font-black text-ink">{claimedCount}</p>
                </div>
                <div className="rounded-[1.3rem] bg-white/82 px-4 py-3 shadow-soft">
                  <p className="text-sm text-slate-500">待领取星芒</p>
                  <p className="mt-1 text-2xl font-black text-ink">{nextRewardTotal}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-[1.35rem] border border-white/80 bg-white/78 px-4 py-3 shadow-soft">
                <div>
                  <p className="text-sm text-slate-500">当前星芒</p>
                  <p className="text-lg font-black text-ink">奖励余额</p>
                </div>
                <div className="flex items-center gap-2 text-xl font-black text-ink">
                  <Coins className="h-5 w-5 text-amber-500" />
                  {starlight}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-[1.35rem] border border-white/80 bg-white/78 px-4 py-3 shadow-soft">
                <div>
                  <p className="text-sm text-slate-500">宝箱规则</p>
                  <p className="text-lg font-black text-ink">先解锁，再开启</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-amber-100 text-amber-700">
                  <Gift className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {groupedAchievements.map(({ category, meta, items }) => (
          <Card key={category} className="space-y-4 rounded-[1.9rem]">
            <div className="space-y-1">
              <p className="text-lg font-black text-ink">{meta.title}</p>
              <p className="text-sm text-slate-500">{meta.description}</p>
            </div>
            <AchievementPanel items={items} onClaim={handleClaim} />
          </Card>
        ))}
      </div>

      <div className="pointer-events-none fixed inset-x-0 top-[calc(4.75rem+var(--safe-top-fallback))] z-[90] flex justify-center px-4">
        <ResultToast visible={Boolean(feedback)} correct={feedback?.positive ?? true} text={feedback?.text ?? ""} />
      </div>
    </Shell>
  );
}
