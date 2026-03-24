"use client";

import { useMemo } from "react";
import { BarChart3, Coins, Flame, Layers3 } from "lucide-react";
import { Shell } from "@/components/shell";
import { Card } from "@/components/ui/card";
import { getExamOverview } from "@/lib/challenge-data";
import { countReleaseWordIds, releaseContentSummary } from "@/lib/content";
import { percentage } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useLearningStore } from "@/stores/learning-store";
import type { ContentSummary } from "@/types/content";

const summaryData = releaseContentSummary as ContentSummary;

function summarizeMode(modeData: ReturnType<typeof useLearningStore.getState>["modes"]["simple"]) {
  const today = new Date().toISOString().slice(0, 10);
  const todaySession = modeData.sessions.find((session) => session.date === today);
  const totalLearned = modeData.sessions.reduce(
    (acc, session) => {
      acc.words += session.words;
      acc.sentences += session.sentences;
      acc.passages += session.passages;
      acc.reviews += session.reviews;
      return acc;
    },
    { words: 0, sentences: 0, passages: 0, reviews: 0 }
  );

  return {
    knownWords: countReleaseWordIds(modeData.knownWords),
    completedPassages: modeData.completedPassageIds.length,
    challenge: getExamOverview(modeData.examLevelProgress),
    todayLearned:
      (todaySession?.words ?? 0) +
      (todaySession?.sentences ?? 0) +
      (todaySession?.passages ?? 0) +
      (todaySession?.reviews ?? 0),
    totalLearned:
      totalLearned.words + totalLearned.sentences + totalLearned.passages + totalLearned.reviews,
    vocabularyProgress: percentage(countReleaseWordIds(modeData.knownWords), summaryData.totals.words)
  };
}

function ModeStatsSection({
  label,
  description,
  accentClass,
  summary
}: {
  label: string;
  description: string;
  accentClass: string;
  summary: ReturnType<typeof summarizeMode>;
}) {
  const strips = [
    {
      title: "已掌握词汇",
      hint: "当前模式下已经真正掌握的单词总量",
      value: `${summary.knownWords}`,
      subValue: `${summary.vocabularyProgress}%`
    },
    {
      title: "今日推进",
      hint: "今天已经完成的学习单元",
      value: `${summary.todayLearned}`,
      subValue: "今日"
    },
    {
      title: "累计学习",
      hint: "单词、句子、短文和复习加总后的学习总量",
      value: `${summary.totalLearned}`,
      subValue: "累计"
    },
    {
      title: "短文完成数",
      hint: "已读完并完成练习的短文篇数",
      value: `${summary.completedPassages}`,
      subValue: "篇"
    },
    {
      title: "已通关关卡",
      hint: "当前模式下已经通关的闯关层数",
      value: `${summary.challenge.clearedLevels}`,
      subValue: `${summary.challenge.unlockedWorlds} 个世界`
    },
    {
      title: "闯关星级",
      hint: "挑战模式累计获得的星级数量",
      value: `${summary.challenge.totalStars}`,
      subValue: "星"
    }
  ];

  return (
    <Card className="space-y-4 rounded-[1.9rem]">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className={`h-3 w-3 rounded-full ${accentClass}`} />
          <p className="text-lg font-black text-ink">{label}</p>
        </div>
        <p className="text-sm text-slate-500">{description}</p>
      </div>

      <div className="space-y-3">
        {strips.map((item) => (
          <div
            key={item.title}
            className="flex items-center justify-between gap-4 rounded-[1.45rem] border border-white/75 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(241,245,249,0.92))] px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-base font-black text-ink">{item.title}</p>
              <p className="mt-0.5 text-sm text-slate-500">{item.hint}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-2xl font-black tracking-tight text-ink">{item.value}</p>
              <p className="text-xs font-semibold text-slate-400">{item.subValue}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function StatsScreen() {
  const currentUsername = useAuthStore((state) => state.currentUsername);
  const modes = useLearningStore((state) => state.modes);
  const commerceStarlight = useLearningStore((state) => state.commerce.starlight);
  const streakDays = useLearningStore((state) => state.streakDays);

  const summaries = useMemo(
    () => ({
      simple: summarizeMode(modes.simple),
      hard: summarizeMode(modes.hard)
    }),
    [modes]
  );

  const totalClearedLevels =
    summaries.simple.challenge.clearedLevels + summaries.hard.challenge.clearedLevels;

  return (
    <Shell>
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-surge">Stats</p>
          <h2 className="text-4xl font-black text-ink">学习统计</h2>
          <p className="text-sm text-slate-500">
            当前账号：{currentUsername ?? "游客模式"}。统计页改成纵向条带布局，方便快速扫一眼重点数据。
          </p>
        </div>

        <Card className="overflow-hidden rounded-[2rem] p-0">
          <div className="grid gap-3 bg-[linear-gradient(135deg,rgba(191,219,254,0.28),rgba(255,255,255,0.96),rgba(216,180,254,0.16))] px-4 py-4 md:grid-cols-[1.08fr_0.92fr] md:px-5">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[1.4rem] bg-sky/15 text-surge">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-lg font-black text-ink">模式数据分开看，更容易判断节奏</p>
                  <p className="text-sm text-slate-500">
                    简单模式和困难模式的进度保持独立，能直接看到哪条学习线更快。
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.3rem] bg-white/82 px-4 py-3 shadow-soft">
                  <p className="text-sm text-slate-500">总通关数</p>
                  <p className="mt-1 text-2xl font-black text-ink">{totalClearedLevels}</p>
                </div>
                <div className="rounded-[1.3rem] bg-white/82 px-4 py-3 shadow-soft">
                  <p className="text-sm text-slate-500">当前星芒</p>
                  <p className="mt-1 text-2xl font-black text-ink">{commerceStarlight}</p>
                </div>
                <div className="rounded-[1.3rem] bg-white/82 px-4 py-3 shadow-soft">
                  <p className="text-sm text-slate-500">连续学习</p>
                  <p className="mt-1 text-2xl font-black text-ink">{streakDays} 天</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-[1.35rem] border border-white/80 bg-white/78 px-4 py-3 shadow-soft">
                <div className="flex items-center gap-3">
                  <Layers3 className="h-5 w-5 text-surge" />
                  <div>
                    <p className="text-sm text-slate-500">简单模式掌握</p>
                    <p className="text-lg font-black text-ink">{summaries.simple.knownWords} 词</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-slate-400">{summaries.simple.vocabularyProgress}%</p>
              </div>
              <div className="flex items-center justify-between rounded-[1.35rem] border border-white/80 bg-white/78 px-4 py-3 shadow-soft">
                <div className="flex items-center gap-3">
                  <Flame className="h-5 w-5 text-rose-500" />
                  <div>
                    <p className="text-sm text-slate-500">困难模式掌握</p>
                    <p className="text-lg font-black text-ink">{summaries.hard.knownWords} 词</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-slate-400">{summaries.hard.vocabularyProgress}%</p>
              </div>
              <div className="flex items-center justify-between rounded-[1.35rem] border border-white/80 bg-white/78 px-4 py-3 shadow-soft">
                <div className="flex items-center gap-3">
                  <Coins className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-sm text-slate-500">双模式总星级</p>
                    <p className="text-lg font-black text-ink">
                      {summaries.simple.challenge.totalStars + summaries.hard.challenge.totalStars} 星
                    </p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-slate-400">挑战累积</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <ModeStatsSection
            label="简单模式"
            description="偏轻量、偏稳步推进，适合日常连续打卡。"
            accentClass="bg-sky-400"
            summary={summaries.simple}
          />
          <ModeStatsSection
            label="困难模式"
            description="更适合冲刺、复盘和强化记忆。"
            accentClass="bg-rose-400"
            summary={summaries.hard}
          />
        </div>
      </div>
    </Shell>
  );
}
