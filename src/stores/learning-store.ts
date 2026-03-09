"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface SessionLog {
  date: string;
  words: number;
  sentences: number;
  passages: number;
  reviews: number;
  correct: number;
  total: number;
}

interface LearningState {
  knownWords: string[];
  difficultWords: string[];
  completedSentenceIds: string[];
  completedPassageIds: string[];
  reviewMistakes: string[];
  streakDays: number;
  lastStudyDate?: string;
  sessions: SessionLog[];
  settings: {
    chineseAssist: boolean;
    motionLevel: "soft" | "calm" | "minimal";
    fontScale: "sm" | "md" | "lg";
    speechEnabled: boolean;
    cloudAudioEnabled: boolean;
    cacheCloudAudio: boolean;
  };
  markWord: (wordId: string, feedback: "known" | "tricky" | "unknown") => void;
  completeSentence: (sentenceId: string) => void;
  completePassage: (passageId: string) => void;
  recordQuizResult: (quizId: string, correct: boolean) => void;
  logDailyProgress: (payload: Omit<SessionLog, "date">) => void;
  updateSetting: <K extends keyof LearningState["settings"]>(
    key: K,
    value: LearningState["settings"][K]
  ) => void;
  resetAll: () => void;
}

const todayKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const calculateStreak = (lastStudyDate?: string) => {
  const today = new Date(todayKey());

  if (!lastStudyDate) {
    return 1;
  }

  const previous = new Date(lastStudyDate);
  const diff = Math.floor((today.getTime() - previous.getTime()) / 86400000);

  if (diff <= 0) {
    return null;
  }

  if (diff === 1) {
    return "increase";
  }

  return "reset";
};

const initialState = {
  knownWords: [],
  difficultWords: [],
  completedSentenceIds: [],
  completedPassageIds: [],
  reviewMistakes: [],
  streakDays: 0,
  lastStudyDate: undefined,
  sessions: [],
  settings: {
    chineseAssist: true,
    motionLevel: "soft" as const,
    fontScale: "md" as const,
    speechEnabled: true,
    cloudAudioEnabled: false,
    cacheCloudAudio: true
  }
};

export const useLearningStore = create<LearningState>()(
  persist(
    (set) => ({
      ...initialState,
      markWord: (wordId, feedback) =>
        set((state) => {
          const knownWords = state.knownWords.filter((id) => id !== wordId);
          const difficultWords = state.difficultWords.filter((id) => id !== wordId);

          if (feedback === "known") {
            knownWords.push(wordId);
          }

          if (feedback !== "known") {
            difficultWords.push(wordId);
          }

          return {
            knownWords: Array.from(new Set(knownWords)),
            difficultWords: Array.from(new Set(difficultWords))
          };
        }),
      completeSentence: (sentenceId) =>
        set((state) => ({
          completedSentenceIds: Array.from(
            new Set([...state.completedSentenceIds, sentenceId])
          )
        })),
      completePassage: (passageId) =>
        set((state) => ({
          completedPassageIds: Array.from(
            new Set([...state.completedPassageIds, passageId])
          )
        })),
      recordQuizResult: (quizId, correct) =>
        set((state) => {
          if (correct) {
            return {
              reviewMistakes: state.reviewMistakes.filter((id) => id !== quizId)
            };
          }

          return {
            reviewMistakes: Array.from(new Set([...state.reviewMistakes, quizId]))
          };
        }),
      logDailyProgress: (payload) =>
        set((state) => {
          const today = todayKey();
          const streakResult = calculateStreak(state.lastStudyDate);
          const existing = state.sessions.find((session) => session.date === today);
          const sessions = state.sessions.filter((session) => session.date !== today);
          sessions.push({
            date: today,
            words: (existing?.words ?? 0) + payload.words,
            sentences: (existing?.sentences ?? 0) + payload.sentences,
            passages: (existing?.passages ?? 0) + payload.passages,
            reviews: (existing?.reviews ?? 0) + payload.reviews,
            correct: (existing?.correct ?? 0) + payload.correct,
            total: (existing?.total ?? 0) + payload.total
          });

          return {
            sessions,
            lastStudyDate: today,
            streakDays:
              streakResult === null
                ? state.streakDays || 1
                : streakResult === "increase"
                  ? state.streakDays + 1
                  : 1
          };
        }),
      updateSetting: (key, value) =>
        set((state) => ({
          settings: {
            ...state.settings,
            [key]: value
          }
        })),
      resetAll: () => set(initialState)
    }),
    {
      name: "english-climb-learning",
      storage: createJSONStorage(() => localStorage)
    }
  )
);
