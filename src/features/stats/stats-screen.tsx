"use client";

import { passages, sentences, words } from "@/lib/content";
import { ProgressCard } from "@/components/progress-card";
import { Shell } from "@/components/shell";
import { StatsPanel } from "@/components/stats-panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { useLearningSummary } from "@/hooks/use-learning-summary";

export function StatsScreen() {
  const summary = useLearningSummary(words.length, sentences.length, passages.length);

  return (
    <Shell>
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Stats"
          title="学习统计"
          description="数据完全保存在浏览器本地，展示你每天积累出来的结果。"
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
      </div>
    </Shell>
  );
}
