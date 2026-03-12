"use client";

import contentSummary from "@/data/content-summary.json";
import { AchievementPanel } from "@/components/achievement-panel";
import { ProgressCard } from "@/components/progress-card";
import { Shell } from "@/components/shell";
import { StatsPanel } from "@/components/stats-panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { useLearningSummary } from "@/hooks/use-learning-summary";
import { buildAchievements } from "@/lib/achievements";
import { getExamOverview } from "@/lib/challenge-data";
import { useAuthStore } from "@/stores/auth-store";
import { useLearningStore } from "@/stores/learning-store";
import type { ContentSummary } from "@/types/content";

const summaryData = contentSummary as ContentSummary;

export function StatsScreen() {
  const summary = useLearningSummary(
    summaryData.totals.words,
    summaryData.totals.sentences,
    summaryData.totals.passages
  );
  const currentUsername = useAuthStore((state) => state.currentUsername);
  const knownWords = useLearningStore((state) => state.knownWords.length);
  const completedSentenceIds = useLearningStore((state) => state.completedSentenceIds.length);
  const completedPassageIds = useLearningStore((state) => state.completedPassageIds.length);
  const reviewMistakes = useLearningStore((state) => state.reviewMistakes.length);
  const streakDays = useLearningStore((state) => state.streakDays);
  const examLevelProgress = useLearningStore((state) => state.examLevelProgress);

  const achievements = buildAchievements({
    knownWords,
    completedSentences: completedSentenceIds,
    completedPassages: completedPassageIds,
    streakDays,
    reviewMistakes,
    examLevelProgress
  });
  const examOverview = getExamOverview(examLevelProgress);

  return (
    <Shell>
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Stats"
          title="学习统计"
          description={`数据完全保存在浏览器本地，当前统计对象：${currentUsername ?? "访客模式"}。`}
        />

        <StatsPanel
          items={[
            { label: "连续学习", value: `${Math.max(summary.streakDays, 1)} 天`, hint: "基于本地打卡" },
            { label: "正确率", value: `${summary.accuracy || 0}%`, hint: "答题即时反馈统计" },
            { label: "本周分钟数", value: `${summary.weeklyMinutes}`, hint: "估算练习时长" }
          ]}
        />

        <div className="grid gap-4 lg:grid-cols-3">
          <ProgressCard title="已学单词" value={summary.wordProgress} detail={`词汇掌握 ${summary.wordProgress}%`} />
          <ProgressCard title="已完成句子" value={summary.sentenceProgress} detail={`句子训练完成 ${summary.sentenceProgress}%`} />
          <ProgressCard title="已读短文" value={summary.passageProgress} detail={`短文阅读完成 ${summary.passageProgress}%`} />
        </div>

        <StatsPanel
          items={[
            { label: "离线词库", value: `${summaryData.totals.words}`, hint: "当前内置词汇总数" },
            { label: "句子训练", value: `${summaryData.totals.sentences}`, hint: "覆盖基础词汇的句子规模" },
            { label: "短文阅读", value: `${summaryData.totals.passages}`, hint: "短文与阅读题总量" }
          ]}
        />

        <StatsPanel
          items={[
            { label: "闯关已解锁", value: `${examOverview.unlockedWorlds} 个世界`, hint: "地图闯关当前解锁进度" },
            { label: "关卡通关", value: `${examOverview.clearedLevels}`, hint: "正确率超过 50% 的关卡数" },
            { label: "累计星星", value: `${examOverview.totalStars}`, hint: "闯关模式累计获得的星数" }
          ]}
        />

        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-surge">Achievements</p>
            <h3 className="mt-2 text-2xl font-black text-ink">成就墙</h3>
            <p className="mt-2 text-sm text-slate-500">把单词掌握、句子训练、地图闯关和连续学习串成一张长期进度表。</p>
          </div>
          <AchievementPanel items={achievements} />
        </div>
      </div>
    </Shell>
  );
}
