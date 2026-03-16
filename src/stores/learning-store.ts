"use client";

import { create } from "zustand";
import { createEmptyQuizSession, normalizeQuizSession, type QuizSessionState } from "@/lib/quiz-session";
import type { ExamLevelRecord } from "@/types/content";

export type StudyMode = "simple" | "hard";
export type TabGroup = "basics" | "advanced" | "practice";

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
  backgroundTheme: "default" | "spring" | "summer" | "autumn" | "winter";
  speechEnabled: boolean;
  cloudAudioEnabled: boolean;
  cacheCloudAudio: boolean;
}

export interface VocabularySessionState {
  currentIndex: number;
  quiz: QuizSessionState;
}

export interface SentencesSessionState {
  currentIndex: number;
  quiz: QuizSessionState;
}

export interface ReadingSessionState {
  currentIndex: number;
  directoryPage: number;
  feedback: string;
  activeQuestionIndex: number;
  quizzes: Record<string, QuizSessionState>;
}

export interface ExpressionsSessionState {
  currentIndex: number;
  quiz: QuizSessionState;
}

export interface WordLibrarySessionState {
  page: number;
  scrollY: number;
  filter: string;
}

export interface ReviewMistakeEvent {
  id: string;
  quizId: string;
  createdAt: string;
}

export interface ReviewSessionState {
  index: number;
  quiz: QuizSessionState;
  cleared: boolean;
}

export interface TestSessionState {
  index: number;
  quiz: QuizSessionState;
  cleared: boolean;
}

export interface ChallengeSessionState {
  activeWorldId: string;
  activeLevelId: string | null;
  selectedLevelId: string | null;
  questionIndex: number;
  results: Record<string, boolean>;
  saved: boolean;
  quiz: QuizSessionState;
}

export interface ModeProgressSnapshot {
  knownWords: string[];
  difficultWords: string[];
  favoriteWords: string[];
  completedSentenceIds: string[];
  completedPassageIds: string[];
  reviewMistakes: ReviewMistakeEvent[];
  examMistakes: string[];
  examLevelProgress: Record<string, ExamLevelRecord>;
  streakDays: number;
  lastStudyDate?: string;
  sessions: SessionLog[];
  vocabularySession: VocabularySessionState;
  sentencesSession: SentencesSessionState;
  readingSession: ReadingSessionState;
  expressionsSession: ExpressionsSessionState;
  wordLibrarySession: WordLibrarySessionState;
  reviewSession: ReviewSessionState;
  testSession: TestSessionState;
  challengeSession: ChallengeSessionState;
}

export interface ModeConfigState {
  activeMode: StudyMode;
}

export interface UserConfigState {
  settings: LearningSettings;
  lastVisitedRoute: string;
  lastVisitedTabs: Record<TabGroup, string>;
}

interface PersistedLearningState {
  version: number;
  data:
    | {
        modes?: Partial<Record<StudyMode, Partial<ModeProgressSnapshot>>>;
        modeConfig?: Partial<ModeConfigState>;
        userConfig?: Partial<UserConfigState>;
      }
    | Partial<ModeProgressSnapshot>;
}

interface LearningState extends ModeProgressSnapshot {
  profileKey: string;
  hydrated: boolean;
  storageWarning: string | null;
  modes: Record<StudyMode, ModeProgressSnapshot>;
  modeConfig: ModeConfigState;
  userConfig: UserConfigState;
  settings: LearningSettings;
  hydrateForProfile: (profileKey: string) => void;
  persistNow: () => void;
  setActiveMode: (mode: StudyMode) => void;
  updateLastVisitedRoute: (route: string) => void;
  updateLastVisitedTab: (group: TabGroup, route: string) => void;
  markWord: (wordId: string, feedback: "known" | "tricky" | "unknown") => void;
  toggleFavoriteWord: (wordId: string) => void;
  completeSentence: (sentenceId: string) => void;
  completePassage: (passageId: string) => void;
  recordQuizResult: (quizId: string, correct: boolean) => void;
  resolveReviewResult: (reviewEventId: string, quizId: string, correct: boolean) => void;
  recordExamWordResult: (wordId: string, correct: boolean) => void;
  saveExamLevelProgress: (levelId: string, accuracy: number, stars: number) => void;
  logDailyProgress: (payload: Omit<SessionLog, "date">) => void;
  updateVocabularySession: (payload: Partial<VocabularySessionState>) => void;
  updateVocabularyQuizSession: (payload: Partial<QuizSessionState>) => void;
  updateSentencesSession: (payload: Partial<SentencesSessionState>) => void;
  updateSentencesQuizSession: (payload: Partial<QuizSessionState>) => void;
  updateReadingSession: (payload: Partial<ReadingSessionState>) => void;
  updateReadingQuizSession: (quizId: string, payload: Partial<QuizSessionState>) => void;
  updateExpressionsSession: (payload: Partial<ExpressionsSessionState>) => void;
  updateExpressionsQuizSession: (payload: Partial<QuizSessionState>) => void;
  updateWordLibrarySession: (payload: Partial<WordLibrarySessionState>) => void;
  updateReviewSession: (index: number) => void;
  updateReviewQuizSession: (payload: Partial<QuizSessionState>) => void;
  clearReviewMistakes: () => void;
  updateTestSession: (index: number) => void;
  updateTestQuizSession: (payload: Partial<QuizSessionState>) => void;
  resetTestSession: () => void;
  updateChallengeSession: (payload: Partial<ChallengeSessionState>) => void;
  updateChallengeQuizSession: (payload: Partial<QuizSessionState>) => void;
  resetChallengeSession: () => void;
  updateSetting: <K extends keyof LearningSettings>(key: K, value: LearningSettings[K]) => void;
  clearStorageWarning: () => void;
  resetAll: () => void;
}

const LEGACY_STORAGE_KEY = "english-climb-learning";
const STORAGE_VERSION = 4;
const SESSION_RETENTION_DAYS = 30;
const REVIEW_MISTAKE_LIMIT = 200;
const EXAM_MISTAKE_LIMIT = 200;
const READING_QUIZ_CACHE_LIMIT = 24;

const defaultSettings: LearningSettings = {
  chineseAssist: true,
  motionLevel: "soft",
  fontScale: "md",
  backgroundTheme: "default",
  speechEnabled: true,
  cloudAudioEnabled: false,
  cacheCloudAudio: true
};

const defaultUserConfig: UserConfigState = {
  settings: defaultSettings,
  lastVisitedRoute: "/",
  lastVisitedTabs: {
    basics: "/vocabulary",
    advanced: "/word-library",
    practice: "/test"
  }
};

const defaultModeConfig: ModeConfigState = {
  activeMode: "simple"
};

const defaultVocabularySession: VocabularySessionState = {
  currentIndex: 0,
  quiz: createEmptyQuizSession()
};

const defaultSentencesSession: SentencesSessionState = {
  currentIndex: 0,
  quiz: createEmptyQuizSession()
};

const defaultReadingSession: ReadingSessionState = {
  currentIndex: 0,
  directoryPage: 0,
  feedback: "",
  activeQuestionIndex: 0,
  quizzes: {}
};

const defaultExpressionsSession: ExpressionsSessionState = {
  currentIndex: 0,
  quiz: createEmptyQuizSession()
};

const defaultWordLibrarySession: WordLibrarySessionState = {
  page: 0,
  scrollY: 0,
  filter: ""
};

const defaultReviewSession: ReviewSessionState = {
  index: 0,
  quiz: createEmptyQuizSession(),
  cleared: false
};

const defaultTestSession: TestSessionState = {
  index: 0,
  quiz: createEmptyQuizSession(),
  cleared: false
};

const defaultChallengeSession: ChallengeSessionState = {
  activeWorldId: "world-1",
  activeLevelId: null,
  selectedLevelId: null,
  questionIndex: 0,
  results: {},
  saved: false,
  quiz: createEmptyQuizSession()
};

const defaultModeProgress: ModeProgressSnapshot = {
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
  vocabularySession: defaultVocabularySession,
  sentencesSession: defaultSentencesSession,
  readingSession: defaultReadingSession,
  expressionsSession: defaultExpressionsSession,
  wordLibrarySession: defaultWordLibrarySession,
  reviewSession: defaultReviewSession,
  testSession: defaultTestSession,
  challengeSession: defaultChallengeSession
};

const defaultModes: Record<StudyMode, ModeProgressSnapshot> = {
  simple: defaultModeProgress,
  hard: defaultModeProgress
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

function createReviewMistakeEvent(quizId: string, createdAt = new Date().toISOString()): ReviewMistakeEvent {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    quizId,
    createdAt
  };
}

function normalizeReviewMistakes(
  items: Array<ReviewMistakeEvent | string> | undefined
): ReviewMistakeEvent[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item, index) => {
      if (typeof item === "string") {
        return createReviewMistakeEvent(item, new Date(index + 1).toISOString());
      }

      if (!item || typeof item !== "object" || typeof item.quizId !== "string") {
        return null;
      }

      return {
        id: typeof item.id === "string" && item.id ? item.id : createReviewMistakeEvent(item.quizId).id,
        quizId: item.quizId,
        createdAt: typeof item.createdAt === "string" && item.createdAt ? item.createdAt : new Date().toISOString()
      };
    })
    .filter((item): item is ReviewMistakeEvent => Boolean(item))
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .slice(-REVIEW_MISTAKE_LIMIT);
}

function trimRecentIds(items: string[], limit: number) {
  const deduped = unique(items);
  return deduped.slice(Math.max(0, deduped.length - limit));
}

function trimSessions(sessions: SessionLog[]) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (SESSION_RETENTION_DAYS - 1));
  const cutoffKey = cutoff.toISOString().slice(0, 10);

  return sessions
    .filter((session) => typeof session.date === "string" && session.date >= cutoffKey)
    .sort((left, right) => left.date.localeCompare(right.date));
}

function normalizeVocabularySession(session?: Partial<VocabularySessionState>): VocabularySessionState {
  return {
    currentIndex:
      typeof session?.currentIndex === "number" && session.currentIndex >= 0 ? session.currentIndex : 0,
    quiz: normalizeQuizSession(session?.quiz)
  };
}

function normalizeSentencesSession(session?: Partial<SentencesSessionState>): SentencesSessionState {
  return {
    currentIndex:
      typeof session?.currentIndex === "number" && session.currentIndex >= 0 ? session.currentIndex : 0,
    quiz: normalizeQuizSession(session?.quiz)
  };
}

function normalizeReadingSession(session?: Partial<ReadingSessionState>): ReadingSessionState {
  const rawQuizzes = session?.quizzes ?? {};
  const quizzes = Object.fromEntries(
    Object.entries(rawQuizzes)
      .slice(-READING_QUIZ_CACHE_LIMIT)
      .map(([quizId, value]) => [quizId, normalizeQuizSession(value, quizId)])
  );

  return {
    currentIndex:
      typeof session?.currentIndex === "number" && session.currentIndex >= 0 ? session.currentIndex : 0,
    directoryPage:
      typeof session?.directoryPage === "number" && session.directoryPage >= 0 ? session.directoryPage : 0,
    feedback: "",
    activeQuestionIndex:
      typeof session?.activeQuestionIndex === "number" && session.activeQuestionIndex >= 0
        ? session.activeQuestionIndex
        : 0,
    quizzes
  };
}

function normalizeExpressionsSession(
  session?: Partial<ExpressionsSessionState>
): ExpressionsSessionState {
  return {
    currentIndex:
      typeof session?.currentIndex === "number" && session.currentIndex >= 0 ? session.currentIndex : 0,
    quiz: normalizeQuizSession(session?.quiz)
  };
}

function normalizeWordLibrarySession(
  session?: Partial<WordLibrarySessionState>
): WordLibrarySessionState {
  return {
    page: typeof session?.page === "number" && session.page >= 0 ? session.page : 0,
    scrollY: typeof session?.scrollY === "number" && session.scrollY >= 0 ? session.scrollY : 0,
    filter: typeof session?.filter === "string" ? session.filter : ""
  };
}

function normalizeReviewSession(session?: Partial<ReviewSessionState>): ReviewSessionState {
  return {
    index: typeof session?.index === "number" && session.index >= 0 ? session.index : 0,
    quiz: normalizeQuizSession(session?.quiz),
    cleared: Boolean(session?.cleared)
  };
}

function normalizeTestSession(session?: Partial<TestSessionState>): TestSessionState {
  return {
    index: typeof session?.index === "number" && session.index >= 0 ? session.index : 0,
    quiz: normalizeQuizSession(session?.quiz),
    cleared: Boolean(session?.cleared)
  };
}

function normalizeChallengeSession(
  session?: Partial<ChallengeSessionState>
): ChallengeSessionState {
  return {
    activeWorldId: session?.activeWorldId || defaultChallengeSession.activeWorldId,
    activeLevelId: session?.activeLevelId ?? null,
    selectedLevelId: session?.selectedLevelId ?? null,
    questionIndex:
      typeof session?.questionIndex === "number" && session.questionIndex >= 0
        ? session.questionIndex
        : 0,
    results: session?.results ?? {},
    saved: false,
    quiz: normalizeQuizSession(session?.quiz)
  };
}

function normalizeModeProgress(snapshot?: Partial<ModeProgressSnapshot>): ModeProgressSnapshot {
  return {
    knownWords: unique(snapshot?.knownWords ?? []),
    difficultWords: unique(snapshot?.difficultWords ?? []),
    favoriteWords: unique(snapshot?.favoriteWords ?? []),
    completedSentenceIds: unique(snapshot?.completedSentenceIds ?? []),
    completedPassageIds: unique(snapshot?.completedPassageIds ?? []),
    reviewMistakes: normalizeReviewMistakes(snapshot?.reviewMistakes),
    examMistakes: trimRecentIds(snapshot?.examMistakes ?? [], EXAM_MISTAKE_LIMIT),
    examLevelProgress: snapshot?.examLevelProgress ?? {},
    streakDays: snapshot?.streakDays ?? 0,
    lastStudyDate: snapshot?.lastStudyDate,
    sessions: trimSessions(snapshot?.sessions ?? []),
    vocabularySession: normalizeVocabularySession(snapshot?.vocabularySession),
    sentencesSession: normalizeSentencesSession(snapshot?.sentencesSession),
    readingSession: normalizeReadingSession(snapshot?.readingSession),
    expressionsSession: normalizeExpressionsSession(snapshot?.expressionsSession),
    wordLibrarySession: normalizeWordLibrarySession(snapshot?.wordLibrarySession),
    reviewSession: normalizeReviewSession(snapshot?.reviewSession),
    testSession: normalizeTestSession(snapshot?.testSession),
    challengeSession: normalizeChallengeSession(snapshot?.challengeSession)
  };
}

function normalizeModeConfig(config?: Partial<ModeConfigState>): ModeConfigState {
  return {
    activeMode: config?.activeMode === "hard" ? "hard" : "simple"
  };
}

function normalizeUserConfig(config?: Partial<UserConfigState>): UserConfigState {
  return {
    settings: {
      ...defaultSettings,
      ...config?.settings
    },
    lastVisitedRoute: config?.lastVisitedRoute || defaultUserConfig.lastVisitedRoute,
    lastVisitedTabs: {
      basics: config?.lastVisitedTabs?.basics || defaultUserConfig.lastVisitedTabs.basics,
      advanced: config?.lastVisitedTabs?.advanced || defaultUserConfig.lastVisitedTabs.advanced,
      practice: config?.lastVisitedTabs?.practice || defaultUserConfig.lastVisitedTabs.practice
    }
  };
}

function cloneModeProgress(snapshot: ModeProgressSnapshot): ModeProgressSnapshot {
  return normalizeModeProgress(JSON.parse(JSON.stringify(snapshot)) as Partial<ModeProgressSnapshot>);
}

function buildDefaultModes() {
  return {
    simple: cloneModeProgress(defaultModeProgress),
    hard: cloneModeProgress(defaultModeProgress)
  } satisfies Record<StudyMode, ModeProgressSnapshot>;
}

function normalizeModes(
  persisted?: Partial<Record<StudyMode, Partial<ModeProgressSnapshot>>>
): Record<StudyMode, ModeProgressSnapshot> {
  const defaults = buildDefaultModes();

  return {
    simple: normalizeModeProgress(persisted?.simple ?? defaults.simple),
    hard: normalizeModeProgress(persisted?.hard ?? defaults.hard)
  };
}

function migrateSnapshot(
  persisted: unknown
): {
  modes: Record<StudyMode, ModeProgressSnapshot>;
  modeConfig: ModeConfigState;
  userConfig: UserConfigState;
} {
  if (!persisted || typeof persisted !== "object") {
    return {
      modes: buildDefaultModes(),
      modeConfig: defaultModeConfig,
      userConfig: defaultUserConfig
    };
  }

  if ("version" in persisted && "data" in persisted) {
    const envelope = persisted as PersistedLearningState;
    const data = envelope.data;

    if (data && typeof data === "object" && "modes" in data) {
      return {
        modes: normalizeModes(data.modes),
        modeConfig: normalizeModeConfig(data.modeConfig),
        userConfig: normalizeUserConfig(data.userConfig)
      };
    }

    const legacyProgress = normalizeModeProgress(data as Partial<ModeProgressSnapshot>);
    return {
      modes: {
        simple: legacyProgress,
        hard: cloneModeProgress(defaultModeProgress)
      },
      modeConfig: defaultModeConfig,
      userConfig: defaultUserConfig
    };
  }

  const legacyProgress = normalizeModeProgress(persisted as Partial<ModeProgressSnapshot>);
  return {
    modes: {
      simple: legacyProgress,
      hard: cloneModeProgress(defaultModeProgress)
    },
    modeConfig: defaultModeConfig,
    userConfig: defaultUserConfig
  };
}

function readSnapshot(profileKey: string) {
  if (typeof window === "undefined") {
    return {
      modes: buildDefaultModes(),
      modeConfig: defaultModeConfig,
      userConfig: defaultUserConfig,
      warning: null as string | null
    };
  }

  try {
    const existing = localStorage.getItem(getStorageKey(profileKey));

    if (existing) {
      const snapshot = migrateSnapshot(JSON.parse(existing) as PersistedLearningState);
      return { ...snapshot, warning: null as string | null };
    }

    if (profileKey === "guest") {
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);

      if (legacy) {
        const snapshot = migrateSnapshot(JSON.parse(legacy) as Partial<ModeProgressSnapshot>);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        return { ...snapshot, warning: null as string | null };
      }
    }
  } catch {
    return {
      modes: buildDefaultModes(),
      modeConfig: defaultModeConfig,
      userConfig: defaultUserConfig,
      warning: "本地学习记录读取失败，已使用默认进度。"
    };
  }

  return {
    modes: buildDefaultModes(),
    modeConfig: defaultModeConfig,
    userConfig: defaultUserConfig,
    warning: null as string | null
  };
}

function saveSnapshot(
  profileKey: string,
  payload: {
    modes: Record<StudyMode, ModeProgressSnapshot>;
    modeConfig: ModeConfigState;
    userConfig: UserConfigState;
  }
) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const persisted: PersistedLearningState = {
      version: STORAGE_VERSION,
      data: payload
    };
    localStorage.setItem(getStorageKey(profileKey), JSON.stringify(persisted));
    return null;
  } catch {
    return "本地存储空间不足，新的学习记录可能没有完整保存。";
  }
}

function projectActiveMode(
  modes: Record<StudyMode, ModeProgressSnapshot>,
  modeConfig: ModeConfigState,
  userConfig: UserConfigState
) {
  const activeProgress = modes[modeConfig.activeMode] ?? cloneModeProgress(defaultModeProgress);

  return {
    ...activeProgress,
    settings: userConfig.settings
  };
}

function buildPersistPayload(state: LearningState) {
  return {
    modes: state.modes,
    modeConfig: state.modeConfig,
    userConfig: state.userConfig
  };
}

export const useLearningStore = create<LearningState>()((set, get) => {
  const updateModeProgress = (updater: (progress: ModeProgressSnapshot, state: LearningState) => ModeProgressSnapshot) =>
    set((state) => {
      const activeMode = state.modeConfig.activeMode;
      const currentProgress = state.modes[activeMode] ?? cloneModeProgress(defaultModeProgress);
      const nextProgress = normalizeModeProgress(updater(currentProgress, state));
      const nextModes = {
        ...state.modes,
        [activeMode]: nextProgress
      };
      const warning = saveSnapshot(state.profileKey, {
        modes: nextModes,
        modeConfig: state.modeConfig,
        userConfig: state.userConfig
      });

      return {
        modes: nextModes,
        ...nextProgress,
        settings: state.userConfig.settings,
        storageWarning: warning ?? state.storageWarning
      };
    });

  const updateUserConfig = (updater: (config: UserConfigState) => UserConfigState) =>
    set((state) => {
      const nextUserConfig = normalizeUserConfig(updater(state.userConfig));
      const warning = saveSnapshot(state.profileKey, {
        modes: state.modes,
        modeConfig: state.modeConfig,
        userConfig: nextUserConfig
      });

      return {
        userConfig: nextUserConfig,
        settings: nextUserConfig.settings,
        storageWarning: warning ?? state.storageWarning
      };
    });

  return {
    ...cloneModeProgress(defaultModeProgress),
    profileKey: "guest",
    hydrated: false,
    storageWarning: null,
    modes: buildDefaultModes(),
    modeConfig: defaultModeConfig,
    userConfig: defaultUserConfig,
    settings: defaultSettings,
    hydrateForProfile: (profileKey) => {
      const { modes, modeConfig, userConfig, warning } = readSnapshot(profileKey);
      const persistWarning = saveSnapshot(profileKey, { modes, modeConfig, userConfig });
      const projected = projectActiveMode(modes, modeConfig, userConfig);

      set({
        ...projected,
        profileKey,
        hydrated: true,
        modes,
        modeConfig,
        userConfig,
        storageWarning: warning ?? persistWarning
      });
    },
    persistNow: () => {
      const state = get();
      const warning = saveSnapshot(state.profileKey, buildPersistPayload(state));
      if (warning) {
        set({ storageWarning: warning });
      }
    },
    setActiveMode: (mode) =>
      set((state) => {
        const nextModeConfig = normalizeModeConfig({ activeMode: mode });
        const projected = projectActiveMode(state.modes, nextModeConfig, state.userConfig);
        const warning = saveSnapshot(state.profileKey, {
          modes: state.modes,
          modeConfig: nextModeConfig,
          userConfig: state.userConfig
        });

        return {
          ...projected,
          modeConfig: nextModeConfig,
          storageWarning: warning ?? state.storageWarning
        };
      }),
    updateLastVisitedRoute: (route) =>
      updateUserConfig((config) => ({
        ...config,
        lastVisitedRoute: route
      })),
    updateLastVisitedTab: (group, route) =>
      updateUserConfig((config) => ({
        ...config,
        lastVisitedTabs: {
          ...config.lastVisitedTabs,
          [group]: route
        }
      })),
    markWord: (wordId, feedback) =>
      updateModeProgress((progress) => {
        const knownWords = progress.knownWords.filter((id) => id !== wordId);
        const difficultWords = progress.difficultWords.filter((id) => id !== wordId);

        if (feedback === "known") {
          knownWords.push(wordId);
        } else {
          difficultWords.push(wordId);
        }

        return {
          ...progress,
          knownWords,
          difficultWords
        };
      }),
    toggleFavoriteWord: (wordId) =>
      updateModeProgress((progress) => ({
        ...progress,
        favoriteWords: progress.favoriteWords.includes(wordId)
          ? progress.favoriteWords.filter((id) => id !== wordId)
          : [...progress.favoriteWords, wordId]
      })),
    completeSentence: (sentenceId) =>
      updateModeProgress((progress) => ({
        ...progress,
        completedSentenceIds: [...progress.completedSentenceIds, sentenceId]
      })),
    completePassage: (passageId) =>
      updateModeProgress((progress) => ({
        ...progress,
        completedPassageIds: [...progress.completedPassageIds, passageId]
      })),
    recordQuizResult: (quizId, correct) =>
      updateModeProgress((progress) => ({
        ...progress,
        reviewMistakes: correct
          ? progress.reviewMistakes
          : [...progress.reviewMistakes, createReviewMistakeEvent(quizId)].slice(-REVIEW_MISTAKE_LIMIT)
      })),
    resolveReviewResult: (reviewEventId, quizId, correct) =>
      updateModeProgress((progress) => {
        const nextReviewMistakes = progress.reviewMistakes.filter((event) => event.id !== reviewEventId);

        return {
          ...progress,
          reviewMistakes: correct
            ? nextReviewMistakes
            : [...nextReviewMistakes, createReviewMistakeEvent(quizId)].slice(-REVIEW_MISTAKE_LIMIT)
        };
      }),
    recordExamWordResult: (wordId, correct) =>
      updateModeProgress((progress) => ({
        ...progress,
        examMistakes: correct
          ? progress.examMistakes.filter((id) => id !== wordId)
          : [...progress.examMistakes, wordId]
      })),
    saveExamLevelProgress: (levelId, accuracy, stars) =>
      updateModeProgress((progress) => {
        const current = progress.examLevelProgress[levelId];
        const bestAccuracy = Math.max(current?.bestAccuracy ?? 0, accuracy);
        const bestStars = Math.max(current?.bestStars ?? 0, stars);

        return {
          ...progress,
          examLevelProgress: {
            ...progress.examLevelProgress,
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
      updateModeProgress((progress) => {
        const today = todayKey();
        const streakResult = calculateStreak(progress.lastStudyDate);
        const existing = progress.sessions.find((session) => session.date === today);
        const sessions = progress.sessions.filter((session) => session.date !== today);

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
          ...progress,
          sessions,
          lastStudyDate: today,
          streakDays:
            streakResult === null
              ? progress.streakDays || 1
              : streakResult === "increase"
                ? progress.streakDays + 1
                : 1
        };
      }),
    updateVocabularySession: (payload) =>
      updateModeProgress((progress) => ({
        ...progress,
        vocabularySession: normalizeVocabularySession({
          ...progress.vocabularySession,
          ...payload
        })
      })),
    updateVocabularyQuizSession: (payload) =>
      updateModeProgress((progress) => ({
        ...progress,
        vocabularySession: {
          ...progress.vocabularySession,
          quiz: normalizeQuizSession({ ...progress.vocabularySession.quiz, ...payload })
        }
      })),
    updateSentencesSession: (payload) =>
      updateModeProgress((progress) => ({
        ...progress,
        sentencesSession: normalizeSentencesSession({
          ...progress.sentencesSession,
          ...payload
        })
      })),
    updateSentencesQuizSession: (payload) =>
      updateModeProgress((progress) => ({
        ...progress,
        sentencesSession: {
          ...progress.sentencesSession,
          quiz: normalizeQuizSession({ ...progress.sentencesSession.quiz, ...payload })
        }
      })),
    updateReadingSession: (payload) =>
      updateModeProgress((progress) => ({
        ...progress,
        readingSession: normalizeReadingSession({
          ...progress.readingSession,
          ...payload
        })
      })),
    updateReadingQuizSession: (quizId, payload) =>
      updateModeProgress((progress) => ({
        ...progress,
        readingSession: {
          ...progress.readingSession,
          quizzes: {
            ...progress.readingSession.quizzes,
            [quizId]: normalizeQuizSession(
              {
                ...progress.readingSession.quizzes[quizId],
                ...payload
              },
              quizId
            )
          }
        }
      })),
    updateExpressionsSession: (payload) =>
      updateModeProgress((progress) => ({
        ...progress,
        expressionsSession: normalizeExpressionsSession({
          ...progress.expressionsSession,
          ...payload
        })
      })),
    updateExpressionsQuizSession: (payload) =>
      updateModeProgress((progress) => ({
        ...progress,
        expressionsSession: {
          ...progress.expressionsSession,
          quiz: normalizeQuizSession({ ...progress.expressionsSession.quiz, ...payload })
        }
      })),
    updateWordLibrarySession: (payload) =>
      updateModeProgress((progress) => ({
        ...progress,
        wordLibrarySession: normalizeWordLibrarySession({
          ...progress.wordLibrarySession,
          ...payload
        })
      })),
    updateReviewSession: (index) =>
      updateModeProgress((progress) => ({
        ...progress,
        reviewSession: {
          ...progress.reviewSession,
          index: Math.max(0, index)
        }
      })),
    updateReviewQuizSession: (payload) =>
      updateModeProgress((progress) => ({
        ...progress,
        reviewSession: {
          ...progress.reviewSession,
          quiz: normalizeQuizSession({ ...progress.reviewSession.quiz, ...payload })
        }
      })),
    clearReviewMistakes: () =>
      updateModeProgress((progress) => ({
        ...progress,
        reviewMistakes: [],
        reviewSession: {
          index: 0,
          quiz: createEmptyQuizSession(),
          cleared: false
        }
      })),
    updateTestSession: (index) =>
      updateModeProgress((progress) => ({
        ...progress,
        testSession: {
          ...progress.testSession,
          index: Math.max(0, index)
        }
      })),
    updateTestQuizSession: (payload) =>
      updateModeProgress((progress) => ({
        ...progress,
        testSession: {
          ...progress.testSession,
          quiz: normalizeQuizSession({ ...progress.testSession.quiz, ...payload })
        }
      })),
    resetTestSession: () =>
      updateModeProgress((progress) => ({
        ...progress,
        testSession: cloneModeProgress(defaultModeProgress).testSession
      })),
    updateChallengeSession: (payload) =>
      updateModeProgress((progress) => ({
        ...progress,
        challengeSession: normalizeChallengeSession({
          ...progress.challengeSession,
          ...payload
        })
      })),
    updateChallengeQuizSession: (payload) =>
      updateModeProgress((progress) => ({
        ...progress,
        challengeSession: {
          ...progress.challengeSession,
          quiz: normalizeQuizSession({ ...progress.challengeSession.quiz, ...payload })
        }
      })),
    resetChallengeSession: () =>
      updateModeProgress((progress) => ({
        ...progress,
        challengeSession: cloneModeProgress(defaultModeProgress).challengeSession
      })),
    updateSetting: (key, value) =>
      updateUserConfig((config) => ({
        ...config,
        settings: {
          ...config.settings,
          [key]: value
        }
      })),
    clearStorageWarning: () => set({ storageWarning: null }),
    resetAll: () => {
      const state = get();
      const activeMode = state.modeConfig.activeMode;
      const nextModes = {
        ...state.modes,
        [activeMode]: cloneModeProgress(defaultModeProgress)
      };
      const projected = projectActiveMode(nextModes, state.modeConfig, state.userConfig);
      const warning = saveSnapshot(state.profileKey, {
        modes: nextModes,
        modeConfig: state.modeConfig,
        userConfig: state.userConfig
      });

      set({
        ...projected,
        modes: nextModes,
        profileKey: state.profileKey,
        hydrated: true,
        storageWarning: warning
      });
    }
  };
});
