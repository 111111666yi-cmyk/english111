"use client";

import contentSummary from "@/data/content-summary.json";
import { AchievementPanel } from "@/components/achievement-panel";
import { ProgressCard } from "@/components/progress-card";
import { Shell } from "@/components/shell";
import { StatsPanel } from "@/components/stats-panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { useLearningSummary } from "@/hooks/use-learning-summary";
import { useAuthStore } from "@/stores/auth-store";
import type { ContentSummary } from "@/types/content";

const summaryData = contentSummary as ContentSummary;

export function StatsScreen() {
  const summary = useLearningSummary(
    summaryData.totals.words,
    summaryData.totals.sentences,
    summaryData.totals.passages
  );
  const currentUsername = useAuthStore((state) => state.currentUsername);

  return (
    <Shell>
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Stats"
          title="学习统计"
          description={`所有同名统计字段都来自统一派生层。当前统计对象：${currentUsername ?? "访客模式"}`}
        />

        <StatsPanel
          items={[
            { label: "连续学习", value: `${Math.max(summary.streakDays, 1)} 天`, hint: "按最近学习记录连续计算" },
            { label: "答题正确率", value: `${summary.accuracy || 0}%`, hint: "来自统一 summary 派生值" },
            { label: "最近 7 天投入", value: `${summary.weeklyMinutes} 分钟`, hint: "不再混入全部历史时长" }
          ]}
        />

        <div className="grid gap-4 lg:grid-cols-3">
          <ProgressCard title="单词掌握" value={summary.wordProgress} detail={`已掌握 ${summary.knownWords} / ${summaryData.totals.words}`} />
          <ProgressCard title="句子训练" value={summary.sentenceProgress} detail={`已完成 ${summary.completedSentences} / ${summaryData.totals.sentences}`} />
          <ProgressCard title="短文阅读" value={summary.passageProgress} detail={`已完成 ${summary.completedPassages} / ${summaryData.totals.passages}`} />
        </div>

        <StatsPanel
          items={[
            { label: "今日单词", value: `${summary.todayWords}`, hint: "按今日真实记录派生" },
            { label: "今日句子", value: `${summary.todaySentences}`, hint: "按今日真实记录派生" },
            { label: "今日短文", value: `${summary.todayPassages}`, hint: "按今日真实记录派生" }
          ]}
        />

        <StatsPanel
          items={[
            { label: "复习池", value: `${summary.reviewMistakes}`, hint: "当前仍待追踪的错题数" },
            { label: "困难词", value: `${summary.difficultWords}`, hint: "被标记为有点难或不会的词" },
            { label: "离线词库", value: `${summaryData.totals.words}`, hint: "当前内置内容总量" }
          ]}
        />

        <StatsPanel
          items={[
            { label: "已解锁世界", value: `${summary.challengeOverview.unlockedWorlds}`, hint: "闯关模式当前可进入的世界数" },
            { label: "已通关关卡", value: `${summary.challengeOverview.clearedLevels}`, hint: "正确率超过 50% 的关卡数" },
            { label: "累计星星", value: `${summary.challengeOverview.totalStars}`, hint: "闯关模式累计获得星数" }
          ]}
        />

        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-surge">Achievements</p>
            <h3 className="mt-2 text-2xl font-black text-ink">成就墙</h3>
            <p className="mt-2 text-sm text-slate-500">
              成就、闯关摘要和学习统计都来自同一套 summary 派生层，避免首页和统计页出现口径不一致。
            </p>
          </div>
          <AchievementPanel items={summary.achievements} />
        </div>
      </div>
    </Shell>
  );
}
