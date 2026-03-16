"use client";

import { useMemo } from "react";
import contentSummary from "@/data/content-summary.json";
import { Shell } from "@/components/shell";
import { Card } from "@/components/ui/card";
import { getExamOverview } from "@/lib/challenge-data";
import { percentage } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useLearningStore } from "@/stores/learning-store";
import type { ContentSummary } from "@/types/content";

const summaryData = contentSummary as ContentSummary;

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
    knownWords: modeData.knownWords.length,
    completedPassages: modeData.completedPassageIds.length,
    challenge: getExamOverview(modeData.examLevelProgress),
    todayLearned:
      (todaySession?.words ?? 0) +
      (todaySession?.sentences ?? 0) +
      (todaySession?.passages ?? 0) +
      (todaySession?.reviews ?? 0),
    totalLearned:
      totalLearned.words + totalLearned.sentences + totalLearned.passages + totalLearned.reviews,
    vocabularyProgress: percentage(modeData.knownWords.length, summaryData.totals.words)
  };
}

export function StatsScreen() {
  const currentUsername = useAuthStore((state) => state.currentUsername);
  const modes = useLearningStore((state) => state.modes);

  const summaries = useMemo(
    () => [
      { label: "简单模式", summary: summarizeMode(modes.simple) },
      { label: "困难模式", summary: summarizeMode(modes.hard) }
    ],
    [modes]
  );

  return (
    <Shell>
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-surge">Stats</p>
          <h2 className="text-4xl font-black text-ink">学习统计</h2>
          <p className="text-sm text-slate-500">
            当前账号：{currentUsername ?? "游客模式"}。统计页与成就页完全独立。
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {summaries.map(({ label, summary }) => (
            <Card key={label} className="space-y-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-surge">{label}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="neu-surface-soft rounded-2xl px-4 py-3">
                  <p className="text-sm text-slate-500">已掌握词汇</p>
                  <p className="mt-2 text-3xl font-black text-ink">{summary.knownWords}</p>
                </div>
                <div className="neu-surface-soft rounded-2xl px-4 py-3">
                  <p className="text-sm text-slate-500">已读短文</p>
                  <p className="mt-2 text-3xl font-black text-ink">{summary.completedPassages}</p>
                </div>
                <div className="neu-surface-soft rounded-2xl px-4 py-3">
                  <p className="text-sm text-slate-500">闯关进度</p>
                  <p className="mt-2 text-3xl font-black text-ink">{summary.challenge.clearedLevels}</p>
                  <p className="text-xs text-slate-400">已通关关卡</p>
                </div>
                <div className="neu-surface-soft rounded-2xl px-4 py-3">
                  <p className="text-sm text-slate-500">词汇进度</p>
                  <p className="mt-2 text-3xl font-black text-ink">{summary.vocabularyProgress}%</p>
                </div>
                <div className="neu-surface-soft rounded-2xl px-4 py-3">
                  <p className="text-sm text-slate-500">今日学习</p>
                  <p className="mt-2 text-3xl font-black text-ink">{summary.todayLearned}</p>
                </div>
                <div className="neu-surface-soft rounded-2xl px-4 py-3">
                  <p className="text-sm text-slate-500">累计学习</p>
                  <p className="mt-2 text-3xl font-black text-ink">{summary.totalLearned}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Shell>
  );
}
