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
    const totals = sessions.reduce(
      (acc, item) => {
        acc.correct += item.correct;
        acc.total += item.total;
        acc.minutes += item.words * 2 + item.sentences * 3 + item.passages * 6 + item.reviews * 2;
        return acc;
      },
      { correct: 0, total: 0, minutes: 0 }
    );

    return {
      wordProgress: percentage(knownWords, totalWords),
      sentenceProgress: percentage(completedSentenceIds, totalSentences),
      passageProgress: percentage(completedPassageIds, totalPassages),
      accuracy: percentage(totals.correct, totals.total),
      weeklyMinutes: totals.minutes,
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
