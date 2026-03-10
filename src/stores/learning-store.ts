"use client";

import { create } from "zustand";

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

export interface LearningSnapshot {
  knownWords: string[];
  difficultWords: string[];
  favoriteWords: string[];
  completedSentenceIds: string[];
  completedPassageIds: string[];
  reviewMistakes: string[];
  streakDays: number;
  lastStudyDate?: string;
  sessions: SessionLog[];
  settings: LearningSettings;
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
  logDailyProgress: (payload: Omit<SessionLog, "date">) => void;
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

const defaultSnapshot: LearningSnapshot = {
  knownWords: [],
  difficultWords: [],
  favoriteWords: [],
  completedSentenceIds: [],
  completedPassageIds: [],
  reviewMistakes: [],
  streakDays: 0,
  lastStudyDate: undefined,
  sessions: [],
  settings: defaultSettings
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
    streakDays: snapshot?.streakDays ?? 0,
    lastStudyDate: snapshot?.lastStudyDate,
    sessions: snapshot?.sessions ?? [],
    settings: {
      ...defaultSettings,
      ...snapshot?.settings
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
    streakDays: state.streakDays,
    lastStudyDate: state.lastStudyDate,
    sessions: state.sessions,
    settings: state.settings
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
