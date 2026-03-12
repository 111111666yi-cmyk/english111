"use client";

import { useMemo } from "react";
import { useLearningStore } from "@/stores/learning-store";
import { percentage } from "@/lib/utils";

export function useLearningSummary(totalWords: number, totalSentences: number, totalPassages: number) {
  const knownWords = useLearningStore((state) => state.knownWords.length);
  const completedSentenceIds = useLearningStore((state) => state.completedSentenceIds.length);
  const completedPassageIds = useLearningStore((state) => state.completedPassageIds.length);
  const difficultWords = useLearningStore((state) => state.difficultWords.length);
  const reviewMistakes = useLearningStore((state) => state.reviewMistakes.length);
  const streakDays = useLearningStore((state) => state.streakDays);
  const sessions = useLearningStore((state) => state.sessions);

  return useMemo(() => {
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const sevenDayStart = sevenDaysAgo.toISOString().slice(0, 10);

    const totals = sessions.reduce(
      (acc, item) => {
        acc.correct += item.correct;
        acc.total += item.total;
        if (item.date >= sevenDayStart) {
          acc.recentMinutes += item.words * 2 + item.sentences * 3 + item.passages * 6 + item.reviews * 2;
        }

        if (item.date === todayKey) {
          acc.todayWords += item.words;
          acc.todaySentences += item.sentences;
          acc.todayPassages += item.passages;
        }

        return acc;
      },
      {
        correct: 0,
        total: 0,
        recentMinutes: 0,
        todayWords: 0,
        todaySentences: 0,
        todayPassages: 0
      }
    );

    return {
      wordProgress: percentage(knownWords, totalWords),
      sentenceProgress: percentage(completedSentenceIds, totalSentences),
      passageProgress: percentage(completedPassageIds, totalPassages),
      accuracy: percentage(totals.correct, totals.total),
      weeklyMinutes: totals.recentMinutes,
      todayWords: totals.todayWords,
      todaySentences: totals.todaySentences,
      todayPassages: totals.todayPassages,
      difficultWords,
      reviewMistakes,
      streakDays: streakDays || 0
    };
  }, [
    completedPassageIds,
    completedSentenceIds,
    difficultWords,
    knownWords,
    reviewMistakes,
    sessions,
    streakDays,
    totalPassages,
    totalSentences,
    totalWords
  ]);
}
