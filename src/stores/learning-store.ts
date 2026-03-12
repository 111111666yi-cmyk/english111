"use client";

import { create } from "zustand";
import type { ExamLevelRecord } from "@/types/content";

export interface SessionLog {
  date: string;
  words: number;
  sentences: number;
  passages: number;
  reviews: number;
  correct: number;
  total: number;
}

export interface LearningSettings {
  chineseAssist: boolean;
  motionLevel: "soft" | "calm" | "minimal";
  fontScale: "sm" | "md" | "lg";
  speechEnabled: boolean;
  cloudAudioEnabled: boolean;
  cacheCloudAudio: boolean;
}

export interface ReviewSessionState {
  index: number;
}

export interface TestSessionState {
  index: number;
}

export interface ChallengeSessionState {
  activeWorldId: string;
  activeLevelId: string | null;
  questionIndex: number;
  results: Record<string, boolean>;
  saved: boolean;
}

export interface LearningSnapshot {
  knownWords: string[];
  difficultWords: string[];
  favoriteWords: string[];
  completedSentenceIds: string[];
  completedPassageIds: string[];
  reviewMistakes: string[];
  examMistakes: string[];
  examLevelProgress: Record<string, ExamLevelRecord>;
  streakDays: number;
  lastStudyDate?: string;
  sessions: SessionLog[];
  settings: LearningSettings;
  reviewSession: ReviewSessionState;
  testSession: TestSessionState;
  challengeSession: ChallengeSessionState;
}

interface LearningState extends LearningSnapshot {
  profileKey: string;
  hydrated: boolean;
  hydrateForProfile: (profileKey: string) => void;
  markWord: (wordId: string, feedback: "known" | "tricky" | "unknown") => void;
  toggleFavoriteWord: (wordId: string) => void;
  completeSentence: (sentenceId: string) => void;
  completePassage: (passageId: string) => void;
  recordQuizResult: (quizId: string, correct: boolean) => void;
  recordExamWordResult: (wordId: string, correct: boolean) => void;
  saveExamLevelProgress: (levelId: string, accuracy: number, stars: number) => void;
  logDailyProgress: (payload: Omit<SessionLog, "date">) => void;
  updateReviewSession: (index: number) => void;
  updateTestSession: (index: number) => void;
  resetTestSession: () => void;
  updateChallengeSession: (payload: Partial<ChallengeSessionState>) => void;
  resetChallengeSession: () => void;
  updateSetting: <K extends keyof LearningSettings>(key: K, value: LearningSettings[K]) => void;
  resetAll: () => void;
}

const LEGACY_STORAGE_KEY = "english-climb-learning";

const defaultSettings: LearningSettings = {
  chineseAssist: true,
  motionLevel: "soft",
  fontScale: "md",
  speechEnabled: true,
  cloudAudioEnabled: false,
  cacheCloudAudio: true
};

const defaultReviewSession: ReviewSessionState = {
  index: 0
};

const defaultTestSession: TestSessionState = {
  index: 0
};

const defaultChallengeSession: ChallengeSessionState = {
  activeWorldId: "world-1",
  activeLevelId: null,
  questionIndex: 0,
  results: {},
  saved: false
};

const defaultSnapshot: LearningSnapshot = {
  knownWords: [],
  difficultWords: [],
  favoriteWords: [],
  completedSentenceIds: [],
  completedPassageIds: [],
  reviewMistakes: [],
  examMistakes: [],
  examLevelProgress: {},
  streakDays: 0,
  lastStudyDate: undefined,
  sessions: [],
  settings: defaultSettings,
  reviewSession: defaultReviewSession,
  testSession: defaultTestSession,
  challengeSession: defaultChallengeSession
};

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

function getStorageKey(profileKey: string) {
  return `learningData_${profileKey}`;
}

function unique(items: string[]) {
  return Array.from(new Set(items));
}

function normalizeSnapshot(snapshot?: Partial<LearningSnapshot>): LearningSnapshot {
  return {
    knownWords: unique(snapshot?.knownWords ?? []),
    difficultWords: unique(snapshot?.difficultWords ?? []),
    favoriteWords: unique(snapshot?.favoriteWords ?? []),
    completedSentenceIds: unique(snapshot?.completedSentenceIds ?? []),
    completedPassageIds: unique(snapshot?.completedPassageIds ?? []),
    reviewMistakes: unique(snapshot?.reviewMistakes ?? []),
    examMistakes: unique(snapshot?.examMistakes ?? []),
    examLevelProgress: snapshot?.examLevelProgress ?? {},
    streakDays: snapshot?.streakDays ?? 0,
    lastStudyDate: snapshot?.lastStudyDate,
    sessions: snapshot?.sessions ?? [],
    settings: {
      ...defaultSettings,
      ...snapshot?.settings
    },
    reviewSession: {
      index:
        typeof snapshot?.reviewSession?.index === "number" && snapshot.reviewSession.index >= 0
          ? snapshot.reviewSession.index
          : 0
    },
    testSession: {
      index:
        typeof snapshot?.testSession?.index === "number" && snapshot.testSession.index >= 0
          ? snapshot.testSession.index
          : 0
    },
    challengeSession: {
      activeWorldId: snapshot?.challengeSession?.activeWorldId || defaultChallengeSession.activeWorldId,
      activeLevelId: snapshot?.challengeSession?.activeLevelId ?? null,
      questionIndex:
        typeof snapshot?.challengeSession?.questionIndex === "number" &&
        snapshot.challengeSession.questionIndex >= 0
          ? snapshot.challengeSession.questionIndex
          : 0,
      results: snapshot?.challengeSession?.results ?? {},
      saved: Boolean(snapshot?.challengeSession?.saved)
    }
  };
}

function readSnapshot(profileKey: string) {
  if (typeof window === "undefined") {
    return defaultSnapshot;
  }

  const existing = localStorage.getItem(getStorageKey(profileKey));

  if (existing) {
    return normalizeSnapshot(JSON.parse(existing) as Partial<LearningSnapshot>);
  }

  if (profileKey === "guest") {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);

    if (legacy) {
      const migrated = normalizeSnapshot(JSON.parse(legacy) as Partial<LearningSnapshot>);
      localStorage.setItem(getStorageKey(profileKey), JSON.stringify(migrated));
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return migrated;
    }
  }

  return defaultSnapshot;
}

function saveSnapshot(profileKey: string, snapshot: LearningSnapshot) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(getStorageKey(profileKey), JSON.stringify(snapshot));
}

function extractSnapshot(state: LearningState): LearningSnapshot {
  return {
    knownWords: state.knownWords,
    difficultWords: state.difficultWords,
    favoriteWords: state.favoriteWords,
    completedSentenceIds: state.completedSentenceIds,
    completedPassageIds: state.completedPassageIds,
    reviewMistakes: state.reviewMistakes,
    examMistakes: state.examMistakes,
    examLevelProgress: state.examLevelProgress,
    streakDays: state.streakDays,
    lastStudyDate: state.lastStudyDate,
    sessions: state.sessions,
    settings: state.settings,
    reviewSession: state.reviewSession,
    testSession: state.testSession,
    challengeSession: state.challengeSession
  };
}

export const useLearningStore = create<LearningState>()((set, get) => {
  const updateAndSave = (updater: (state: LearningState) => Partial<LearningSnapshot>) =>
    set((state) => {
      const next = normalizeSnapshot({
        ...extractSnapshot(state),
        ...updater(state)
      });

      saveSnapshot(state.profileKey, next);

      return next;
    });

  return {
    ...defaultSnapshot,
    profileKey: "guest",
    hydrated: false,
    hydrateForProfile: (profileKey) => {
      const snapshot = readSnapshot(profileKey);
      set({
        ...snapshot,
        profileKey,
        hydrated: true
      });
    },
    markWord: (wordId, feedback) =>
      updateAndSave((state) => {
        const knownWords = state.knownWords.filter((id) => id !== wordId);
        const difficultWords = state.difficultWords.filter((id) => id !== wordId);

        if (feedback === "known") {
          knownWords.push(wordId);
        } else {
          difficultWords.push(wordId);
        }

        return {
          knownWords,
          difficultWords
        };
      }),
    toggleFavoriteWord: (wordId) =>
      updateAndSave((state) => ({
        favoriteWords: state.favoriteWords.includes(wordId)
          ? state.favoriteWords.filter((id) => id !== wordId)
          : [...state.favoriteWords, wordId]
      })),
    completeSentence: (sentenceId) =>
      updateAndSave((state) => ({
        completedSentenceIds: [...state.completedSentenceIds, sentenceId]
      })),
    completePassage: (passageId) =>
      updateAndSave((state) => ({
        completedPassageIds: [...state.completedPassageIds, passageId]
      })),
    recordQuizResult: (quizId, correct) =>
      updateAndSave((state) =>
        correct
          ? {
              reviewMistakes: state.reviewMistakes.filter((id) => id !== quizId)
            }
          : {
              reviewMistakes: [...state.reviewMistakes, quizId]
            }
      ),
    recordExamWordResult: (wordId, correct) =>
      updateAndSave((state) => ({
        examMistakes: correct
          ? state.examMistakes.filter((id) => id !== wordId)
          : [...state.examMistakes, wordId]
      })),
    saveExamLevelProgress: (levelId, accuracy, stars) =>
      updateAndSave((state) => {
        const current = state.examLevelProgress[levelId];
        const bestAccuracy = Math.max(current?.bestAccuracy ?? 0, accuracy);
        const bestStars = Math.max(current?.bestStars ?? 0, stars);

        return {
          examLevelProgress: {
            ...state.examLevelProgress,
            [levelId]: {
              bestAccuracy,
              bestStars,
              attempts: (current?.attempts ?? 0) + 1,
              cleared: bestAccuracy > 50
            }
          }
        };
      }),
    logDailyProgress: (payload) =>
      updateAndSave((state) => {
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
    updateReviewSession: (index) =>
      updateAndSave(() => ({
        reviewSession: {
          index: Math.max(0, index)
        }
      })),
    updateTestSession: (index) =>
      updateAndSave(() => ({
        testSession: {
          index: Math.max(0, index)
        }
      })),
    resetTestSession: () =>
      updateAndSave(() => ({
        testSession: defaultTestSession
      })),
    updateChallengeSession: (payload) =>
      updateAndSave((state) => ({
        challengeSession: {
          ...state.challengeSession,
          ...payload
        }
      })),
    resetChallengeSession: () =>
      updateAndSave(() => ({
        challengeSession: defaultChallengeSession
      })),
    updateSetting: (key, value) =>
      updateAndSave((state) => ({
        settings: {
          ...state.settings,
          [key]: value
        }
      })),
    resetAll: () => {
      const profileKey = get().profileKey;
      saveSnapshot(profileKey, defaultSnapshot);
      set({
        ...defaultSnapshot,
        profileKey,
        hydrated: true
      });
    }
  };
});
