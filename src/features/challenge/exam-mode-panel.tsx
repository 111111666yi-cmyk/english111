"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Flag,
  Lock,
  MapPinned,
  Sparkles,
  Star,
  Target,
  Trophy,
  X
} from "lucide-react";
import { QuizCard } from "@/components/quiz-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getVocabularyQuiz } from "@/data/quizzes";
import {
  examWorlds,
  examWorldsWarning,
  getExamStars,
  getExamWorldUnlockState
} from "@/lib/challenge-data";
import { appConfig } from "@/lib/app-config";
import { isReleaseWordId, releaseWordIndexById, wordById } from "@/lib/content";
import { createEmptyQuizSession } from "@/lib/quiz-session";
import { cn } from "@/lib/utils";
import { useLearningStore } from "@/stores/learning-store";
import {
  canAccessLevel,
  findLevelEntry,
  getCurrentPlayableWorldIndex,
  getCurrentPlayerLevel,
  getLevelUnlockState,
  getNextLevelId
} from "@/features/challenge/challenge-shared";
import {
  challengeCopy,
  getChallengeModeStats,
  getChallengePalette,
  getChallengeRewardHint,
  getChallengeWorldStats
} from "@/features/challenge/challenge-ui";

const NODE_Y = [98, 164, 230, 296, 362, 428, 494, 560, 626, 692, 758, 824];
const NODE_X = [78, 172, 102, 188, 84, 182, 94, 190, 82, 178, 104, 186];
const watercolorShapes = [
  ["bg-amber-200/50", "left-[-5%] top-[8%] h-36 w-56 rotate-[-10deg]", "bg-amber-100/60", "right-[4%] top-[20%] h-28 w-44 rotate-[14deg]", "bg-orange-100/55", "left-[10%] bottom-[12%] h-40 w-52 rotate-[10deg]"],
  ["bg-emerald-200/50", "left-[2%] top-[10%] h-40 w-60 rotate-[8deg]", "bg-lime-100/60", "right-[8%] top-[22%] h-32 w-48 rotate-[-12deg]", "bg-teal-100/55", "left-[12%] bottom-[10%] h-36 w-56 rotate-[6deg]"],
  ["bg-cyan-200/50", "left-[-2%] top-[9%] h-36 w-56 rotate-[6deg]", "bg-sky-100/60", "right-[4%] top-[18%] h-28 w-46 rotate-[18deg]", "bg-blue-100/55", "left-[8%] bottom-[10%] h-40 w-54 rotate-[-8deg]"],
  ["bg-indigo-200/50", "left-[0%] top-[8%] h-38 w-58 rotate-[10deg]", "bg-blue-100/60", "right-[8%] top-[24%] h-30 w-42 rotate-[-10deg]", "bg-violet-100/55", "left-[10%] bottom-[12%] h-42 w-52 rotate-[8deg]"],
  ["bg-violet-200/50", "left-[0%] top-[8%] h-38 w-58 rotate-[-8deg]", "bg-fuchsia-100/60", "right-[6%] top-[22%] h-30 w-44 rotate-[12deg]", "bg-purple-100/55", "left-[12%] bottom-[11%] h-40 w-54 rotate-[5deg]"],
  ["bg-rose-200/50", "left-[1%] top-[7%] h-38 w-56 rotate-[8deg]", "bg-pink-100/60", "right-[8%] top-[21%] h-32 w-46 rotate-[-10deg]", "bg-orange-100/50", "left-[14%] bottom-[9%] h-40 w-52 rotate-[10deg]"],
  ["bg-slate-300/45", "left-[1%] top-[8%] h-40 w-56 rotate-[-6deg]", "bg-blue-100/55", "right-[6%] top-[24%] h-30 w-48 rotate-[10deg]", "bg-sky-100/55", "left-[10%] bottom-[11%] h-42 w-54 rotate-[8deg]"],
  ["bg-yellow-200/45", "left-[1%] top-[7%] h-36 w-56 rotate-[8deg]", "bg-cyan-100/55", "right-[8%] top-[20%] h-30 w-46 rotate-[-14deg]", "bg-amber-100/55", "left-[10%] bottom-[12%] h-40 w-52 rotate-[9deg]"],
  ["bg-sky-200/45", "left-[0%] top-[6%] h-40 w-58 rotate-[6deg]", "bg-indigo-100/55", "right-[6%] top-[20%] h-30 w-46 rotate-[16deg]", "bg-cyan-100/55", "left-[12%] bottom-[10%] h-42 w-52 rotate-[-6deg]"]
] as const;

function buildNodeClass({
  unlocked,
  cleared,
  current,
  perfect
}: {
  unlocked: boolean;
  cleared: boolean;
  current: boolean;
  perfect: boolean;
}) {
  if (!unlocked) {
    return "border-slate-300 bg-[linear-gradient(145deg,#dfe5eb,#f3f6f9)] text-slate-400 shadow-[inset_5px_5px_10px_rgba(182,190,200,0.45),inset_-5px_-5px_10px_rgba(255,255,255,0.9)]";
  }

  if (current) {
    return "border-white bg-[linear-gradient(145deg,#7fd6ff,#6170f7)] text-white shadow-[0_0_0_5px_rgba(255,255,255,0.58),12px_12px_26px_rgba(104,135,219,0.28),-8px_-8px_18px_rgba(255,255,255,0.82)]";
  }

  if (perfect) {
    return "border-amber-200 bg-[linear-gradient(145deg,#fff7d6,#ffe39a)] text-amber-950 shadow-[10px_10px_22px_rgba(245,158,11,0.18),-8px_-8px_18px_rgba(255,255,255,0.82)]";
  }

  if (cleared) {
    return "border-emerald-200 bg-[linear-gradient(145deg,#f6fffa,#abebc0)] text-emerald-900 shadow-[8px_8px_18px_rgba(112,190,146,0.22),-8px_-8px_18px_rgba(255,255,255,0.82)]";
  }

  return "border-amber-200 bg-[linear-gradient(145deg,#fff8d9,#ffd378)] text-amber-950 shadow-[8px_8px_18px_rgba(221,180,72,0.22),-8px_-8px_18px_rgba(255,255,255,0.82)]";
}

function getSeasonGlowClass(season: "spring" | "summer" | "autumn" | "winter") {
  if (season === "spring") {
    return "bg-[radial-gradient(circle_at_20%_20%,rgba(255,220,236,0.55),transparent_30%),radial-gradient(circle_at_78%_24%,rgba(214,245,216,0.46),transparent_28%)]";
  }
  if (season === "summer") {
    return "bg-[radial-gradient(circle_at_18%_22%,rgba(194,236,255,0.52),transparent_30%),radial-gradient(circle_at_80%_18%,rgba(255,244,183,0.42),transparent_28%)]";
  }
  if (season === "autumn") {
    return "bg-[radial-gradient(circle_at_16%_24%,rgba(255,219,183,0.5),transparent_30%),radial-gradient(circle_at_78%_20%,rgba(255,236,201,0.42),transparent_28%)]";
  }
  return "bg-[radial-gradient(circle_at_18%_22%,rgba(228,239,255,0.55),transparent_30%),radial-gradient(circle_at_76%_18%,rgba(255,255,255,0.5),transparent_28%)]";
}

function OverlayFrame({
  children,
  onClose
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="challenge-overlay-panel max-h-[calc(100dvh-3rem)] w-full max-w-xl overflow-y-auto overscroll-contain"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </motion.div>
    </div>
  );
}

function ProgressStrip({
  label,
  value,
  summary,
  accent,
  soft
}: {
  label: string;
  value: number;
  summary: string;
  accent: string;
  soft: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <p className="text-sm font-bold text-slate-900">{summary}</p>
      </div>
      <div className="h-2.5 rounded-full bg-white/82 shadow-[inset_0_1px_2px_rgba(148,163,184,0.22)]">
        <div
          className="challenge-path-flow h-full rounded-full"
          style={{
            width: `${Math.max(0, Math.min(value, 100))}%`,
            background: `linear-gradient(90deg, ${accent}, ${soft}, ${accent})`
          }}
        />
      </div>
    </div>
  );
}

function ModeOverviewCard({
  label,
  stats,
  active,
  paletteAccent,
  paletteGlow
}: {
  label: string;
  stats: ReturnType<typeof getChallengeModeStats>;
  active: boolean;
  paletteAccent: string;
  paletteGlow: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] border px-4 py-4",
        active ? "border-white/85 bg-white/90" : "border-white/70 bg-white/78"
      )}
      style={{
        boxShadow: active
          ? `0 16px 34px ${paletteGlow}, inset 0 1px 0 rgba(255,255,255,0.8)`
          : "0 10px 24px rgba(148,163,184,0.14)"
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-900">{label}</p>
          <p className="mt-1 text-xs text-slate-500">
            已完成 {stats.clearedLevels}/{stats.totalLevels} 关
          </p>
        </div>
        {active ? (
          <span
            className="rounded-full px-3 py-1 text-[11px] font-bold text-white"
            style={{ background: `linear-gradient(145deg, ${paletteAccent}, ${paletteAccent})` }}
          >
            当前
          </span>
        ) : null}
      </div>

      <div className="mt-3 space-y-3">
        <ProgressStrip
          label="模式完成率"
          value={stats.completionPercent}
          summary={`${stats.completionPercent}%`}
          accent={paletteAccent}
          soft="rgba(255,255,255,0.92)"
        />

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-[1.15rem] bg-slate-50 px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">总星数</p>
            <p className="mt-1.5 text-lg font-black text-slate-900">{stats.totalStars}</p>
          </div>
          <div className="rounded-[1.15rem] bg-slate-50 px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">已解锁世界</p>
            <p className="mt-1.5 text-lg font-black text-slate-900">{stats.unlockedWorlds}</p>
          </div>
          <div className="rounded-[1.15rem] bg-slate-50 px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">当前世界</p>
            <p className="mt-1.5 text-lg font-black text-slate-900">{stats.currentWorld.clearedLevels}/{stats.currentWorld.totalLevels}</p>
          </div>
          <div className="rounded-[1.15rem] bg-slate-50 px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">三星关卡</p>
            <p className="mt-1.5 text-lg font-black text-slate-900">{stats.currentWorld.perfectLevels}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressPanel({
  open,
  onClose,
  worldName,
  modeLabel,
  currentWorldIndex,
  currentLevelLabel
}: {
  open: boolean;
  onClose: () => void;
  worldName: string;
  modeLabel: string;
  currentWorldIndex: number;
  currentLevelLabel: string;
}) {
  const simpleProgress = useLearningStore((state) => state.modes.simple.examLevelProgress);
  const hardProgress = useLearningStore((state) => state.modes.hard.examLevelProgress);
  const activeWorld = examWorlds[currentWorldIndex];
  const palette = getChallengePalette(activeWorld);
  const activeProgress = modeLabel === "简单" ? simpleProgress : hardProgress;
  const simpleStats = useMemo(() => getChallengeModeStats(simpleProgress, currentWorldIndex), [simpleProgress, currentWorldIndex]);
  const hardStats = useMemo(() => getChallengeModeStats(hardProgress, currentWorldIndex), [hardProgress, currentWorldIndex]);
  const currentWorldStats = useMemo(() => getChallengeWorldStats(activeProgress, currentWorldIndex), [activeProgress, currentWorldIndex]);

  if (!open) {
    return null;
  }

  return (
    <OverlayFrame onClose={onClose}>
      <Card className="space-y-4 rounded-[1.85rem] border border-white/76 bg-[linear-gradient(145deg,#f8fbff,#dfe7ef)] shadow-[0_28px_56px_rgba(148,163,184,0.22)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-surge">进度</p>
            <h3 className="mt-2 text-2xl font-black text-ink">{worldName}</h3>
            <p className="mt-1 text-sm text-slate-500">
              当前关卡：第 {currentLevelLabel} 关 · {modeLabel}模式
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="neu-chip inline-flex h-9 w-9 items-center justify-center rounded-2xl text-slate-600"
            aria-label="关闭进度面板"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          className="rounded-[1.7rem] border border-white/82 px-4 py-4 shadow-[0_20px_40px_rgba(148,163,184,0.16)]"
          style={{ background: `linear-gradient(145deg, ${palette.accentSurface}, rgba(255,255,255,0.95))` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: palette.accentText }}>
                {challengeCopy.currentWorld}
              </p>
              <h4 className="mt-2 text-xl font-black text-slate-950">{worldName}</h4>
              <p className="mt-1 text-sm text-slate-600">当前世界：{currentWorldIndex + 1}/{examWorlds.length}</p>
            </div>
            <span
              className="rounded-full px-3 py-1 text-xs font-bold"
              style={{
                color: palette.accentText,
                background: `linear-gradient(145deg, ${palette.accentSurfaceStrong}, rgba(255,255,255,0.95))`
              }}
            >
              {modeLabel}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            <ProgressStrip
              label="当前世界推进"
              value={currentWorldStats.completionPercent}
              summary={`${currentWorldStats.clearedLevels}/${currentWorldStats.totalLevels}`}
              accent={palette.accent}
              soft={palette.pathEnd}
            />
            <ProgressStrip
              label="当前世界星级"
              value={currentWorldStats.starPercent}
              summary={`${currentWorldStats.totalStars}/${currentWorldStats.totalLevels * 3}`}
              accent={palette.accentStrong}
              soft={palette.pathEnd}
            />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-[1.15rem] bg-white/84 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">当前关卡</p>
              <p className="mt-1.5 text-lg font-black text-slate-900">第 {currentLevelLabel} 关</p>
            </div>
            <div className="rounded-[1.15rem] bg-white/84 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">三星关卡</p>
              <p className="mt-1.5 text-lg font-black text-slate-900">{currentWorldStats.perfectLevels}</p>
            </div>
            <div className="rounded-[1.15rem] bg-white/84 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">剩余目标</p>
              <p className="mt-1.5 text-lg font-black text-slate-900">{currentWorldStats.remainingLevels}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          <ModeOverviewCard
            label="简单模式"
            stats={simpleStats}
            active={modeLabel === "简单"}
            paletteAccent={palette.accent}
            paletteGlow={palette.glow}
          />
          <ModeOverviewCard
            label="困难模式"
            stats={hardStats}
            active={modeLabel === "困难"}
            paletteAccent={palette.accentStrong}
            paletteGlow={palette.glow}
          />
        </div>
      </Card>
    </OverlayFrame>
  );
}

function MistakePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const examMistakes = useLearningStore((state) => state.examMistakes);
  const mistakeWords = useMemo(
    () => examMistakes.filter(isReleaseWordId).map((id) => wordById.get(id)).filter(Boolean),
    [examMistakes]
  );

  if (!open) {
    return null;
  }

  return (
    <OverlayFrame onClose={onClose}>
      <Card className="space-y-4 rounded-[1.75rem]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-surge">错题库</p>
            <h3 className="mt-2 text-2xl font-black text-ink">闯关专属错题</h3>
            <p className="mt-1 text-sm text-slate-500">这里只收录闯关里答错的题目，不混入普通测试和复习。</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="neu-chip inline-flex h-9 w-9 items-center justify-center rounded-2xl text-slate-600"
            aria-label="关闭错题库"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {mistakeWords.length ? (
          <div className="grid max-h-[55vh] gap-2 overflow-y-auto pr-1">
            {mistakeWords.map((word) => (
              <div key={word!.id} className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
                <p className="text-base font-black text-ink">{word!.word}</p>
                <p className="mt-1 text-sm text-slate-500">{word!.meaningZh}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            当前还没有闯关错题。
          </div>
        )}
      </Card>
    </OverlayFrame>
  );
}

function ChallengeStageModal({
  levelId,
  onClose,
  onLevelCompleted
}: {
  levelId: string;
  onClose: () => void;
  onLevelCompleted: (completedId: string | null, unlockedId: string | null) => void;
}) {
  const activeMode = useLearningStore((state) => state.modeConfig.activeMode);
  const challengeSession = useLearningStore((state) => state.challengeSession);
  const examLevelProgress = useLearningStore((state) => state.examLevelProgress);
  const recordExamWordResult = useLearningStore((state) => state.recordExamWordResult);
  const saveExamLevelProgress = useLearningStore((state) => state.saveExamLevelProgress);
  const logDailyProgress = useLearningStore((state) => state.logDailyProgress);
  const updateChallengeSession = useLearningStore((state) => state.updateChallengeSession);
  const updateChallengeQuizSession = useLearningStore((state) => state.updateChallengeQuizSession);
  const persistNow = useLearningStore((state) => state.persistNow);

  const levelEntry = findLevelEntry(levelId);

  useEffect(() => {
    if (!levelEntry) {
      return;
    }

    if (challengeSession.activeLevelId !== levelEntry.level.id) {
      updateChallengeSession({
        activeWorldId: levelEntry.world.id,
        activeLevelId: levelEntry.level.id,
        selectedLevelId: levelEntry.level.id,
        questionIndex: 0,
        results: {},
        saved: false,
        quiz: createEmptyQuizSession()
      });
      persistNow();
    }
  }, [challengeSession.activeLevelId, levelEntry, persistNow, updateChallengeSession]);

  if (!levelEntry) {
    return null;
  }

  const isUnlocked = canAccessLevel(levelEntry.worldIndex, levelEntry.levelIndex, examLevelProgress);
  if (!isUnlocked) {
    return null;
  }

  const activeQuizzes = levelEntry.level.words.map((word) =>
    getVocabularyQuiz(releaseWordIndexById.get(word.id) ?? 0, activeMode)
  );
  const questionIndex = Math.min(challengeSession.questionIndex, Math.max(activeQuizzes.length - 1, 0));
  const currentQuiz = activeQuizzes[questionIndex] ?? null;
  const currentWord = levelEntry.level.words[questionIndex] ?? levelEntry.level.words[0];
  const answeredCount = Object.keys(challengeSession.results).length;
  const correctCount = Object.values(challengeSession.results).filter(Boolean).length;
  const accuracy = activeQuizzes.length ? Math.round((correctCount / activeQuizzes.length) * 100) : 0;
  const stars = getExamStars(accuracy);
  const cleared = accuracy >= 50;
  const allAnswered = activeQuizzes.length > 0 && answeredCount >= activeQuizzes.length;

  const goPrevious = () => {
    const nextIndex = questionIndex - 1 < 0 ? activeQuizzes.length - 1 : questionIndex - 1;
    updateChallengeSession({
      questionIndex: nextIndex,
      quiz: createEmptyQuizSession()
    });
    persistNow();
  };

  const goNext = () => {
    const nextIndex = questionIndex + 1 >= activeQuizzes.length ? 0 : questionIndex + 1;
    updateChallengeSession({
      questionIndex: nextIndex,
      quiz: createEmptyQuizSession()
    });
    persistNow();
  };

  const closeToMap = () => {
    updateChallengeSession({
      activeWorldId: levelEntry.world.id,
      activeLevelId: levelEntry.level.id,
      selectedLevelId: levelEntry.level.id,
      questionIndex,
      results: challengeSession.results,
      saved: false,
      quiz: challengeSession.quiz
    });
    persistNow();
    onClose();
  };

  const finishLevel = () => {
    saveExamLevelProgress(levelEntry.level.id, accuracy, stars);
    const nextLevelId = cleared ? getNextLevelId(levelEntry.worldIndex, levelEntry.levelIndex) : null;
    const nextLevelEntry = nextLevelId ? findLevelEntry(nextLevelId) : null;
    updateChallengeSession({
      activeWorldId: nextLevelEntry?.world.id ?? levelEntry.world.id,
      activeLevelId: null,
      selectedLevelId: cleared ? nextLevelId ?? levelEntry.level.id : levelEntry.level.id,
      questionIndex: 0,
      results: {},
      saved: true,
      quiz: createEmptyQuizSession()
    });
    persistNow();
    onLevelCompleted(cleared ? levelEntry.level.id : null, nextLevelId);
  };

  return (
    <OverlayFrame onClose={closeToMap}>
      <Card className="challenge-stage-card space-y-4 rounded-[1.9rem]">
        {!allAnswered ? (
          <>
            <div className="space-y-2 text-center">
              <p className="text-sm font-semibold text-surge">{levelEntry.world.name}</p>
              <h3 className="text-2xl font-black text-ink">第 {levelEntry.level.label} 关</h3>
              <p className="text-sm text-slate-500" data-testid="challenge-current-index">
                {activeMode === "simple" ? "简单模式" : "困难模式"} · {questionIndex + 1}/{activeQuizzes.length}
              </p>
            </div>

            {activeMode === "simple" && currentWord ? (
              <div className="rounded-[1.5rem] bg-slate-50 px-4 py-5 text-center">
                <p className="text-[2rem] font-black text-ink">{currentWord.word}</p>
              </div>
            ) : null}

            {currentQuiz ? (
              <QuizCard
                quiz={currentQuiz}
                variant="challenge"
                autoAdvance="correct"
                sessionState={challengeSession.quiz}
                onSessionStateChange={updateChallengeQuizSession}
                onAdvance={() => goNext()}
                onResult={(correct) => {
                  if (challengeSession.results[currentQuiz.id] !== undefined) {
                    return;
                  }

                  updateChallengeSession({
                    results: {
                      ...challengeSession.results,
                      [currentQuiz.id]: correct
                    }
                  });
                  recordExamWordResult(currentQuiz.sourceRef, correct);
                  logDailyProgress({
                    words: 0,
                    sentences: 0,
                    passages: 0,
                    reviews: 1,
                    correct: correct ? 1 : 0,
                    total: 1
                  });
                  persistNow();
                }}
                compact={activeMode === "simple"}
                hideHeader={activeMode === "simple"}
              />
            ) : (
              <Card>
                <p className="text-sm text-slate-500">正在准备本关题目...</p>
              </Card>
            )}

            <div className="challenge-stage-actions sticky bottom-0 z-10 rounded-[1.4rem] bg-[linear-gradient(145deg,#eef2f6,#dde4ec)] px-3 py-3 shadow-[inset_3px_3px_8px_rgba(255,255,255,0.45),8px_8px_16px_rgba(179,188,199,0.2)]">
              <div className="flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="h-10 min-w-10 px-3"
                  onClick={goPrevious}
                  data-testid="challenge-prev-button"
                >
                  {"<"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-10 px-4"
                  onClick={closeToMap}
                  data-testid="challenge-back-to-map"
                >
                  <MapPinned className="mr-1 h-4 w-4" />
                  返回地图
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-10 min-w-10 px-3"
                  onClick={goNext}
                  data-testid="challenge-next-button"
                >
                  {">"}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="challenge-summary space-y-4 text-center">
            <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(145deg,#fff4c7,#ffd46a)] text-amber-600 shadow-soft">
              <Trophy className="h-8 w-8" />
            </div>
            <p className="text-3xl font-black text-ink">{stars} 颗星</p>
            <p className="text-lg font-semibold text-slate-700">{accuracy >= 50 ? (stars === 0 ? "0 星通关，已解锁下一关" : "恭喜通关") : "再试试吧"}</p>
            <p className="text-base text-slate-600">正确率 {accuracy}%</p>
            <p className="text-sm text-slate-500">导入错题库：闯关答错题已写入专属错题库</p>
            <div className="flex items-center justify-center gap-3">
              <Button type="button" variant="secondary" onClick={closeToMap}>
                返回地图
              </Button>
              <Button type="button" onClick={finishLevel}>
                {cleared ? "完成结算" : "重新挑战"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </OverlayFrame>
  );
}

export function ExamModePanel({
  completedLevelId,
  unlockedLevelId
}: {
  completedLevelId?: string | null;
  unlockedLevelId?: string | null;
}) {
  const hydrated = useLearningStore((state) => state.hydrated);
  const activeMode = useLearningStore((state) => state.modeConfig.activeMode);
  const challengeSession = useLearningStore((state) => state.challengeSession);
  const examLevelProgress = useLearningStore((state) => state.examLevelProgress);
  const updateChallengeSession = useLearningStore((state) => state.updateChallengeSession);
  const persistNow = useLearningStore((state) => state.persistNow);
  const [progressOpen, setProgressOpen] = useState(false);
  const [mistakesOpen, setMistakesOpen] = useState(false);
  const [modalLevelId, setModalLevelId] = useState<string | null>(null);
  const [bannerCompleted, setBannerCompleted] = useState<string | null>(completedLevelId ?? null);
  const [bannerUnlocked, setBannerUnlocked] = useState<string | null>(unlockedLevelId ?? null);

  const isChallengeUnavailable = Boolean(examWorldsWarning) || examWorlds.length === 0;
  const activeModeLabel = activeMode === "simple" ? "简单" : "困难";
  const sequentialWorldIndex = getCurrentPlayableWorldIndex(examLevelProgress);
  const [worldIndexState, setWorldIndexState] = useState(sequentialWorldIndex);
  const currentWorldIndex = Math.min(worldIndexState, examWorlds.length - 1);
  const activeWorld = examWorlds[currentWorldIndex];
  const worldUnlocked = getExamWorldUnlockState(examLevelProgress, currentWorldIndex);
  const currentLevel = getCurrentPlayerLevel(currentWorldIndex, examLevelProgress, challengeSession.activeLevelId);
  const currentLevelLabel = currentLevel?.label ?? "1";
  const palette = getChallengePalette(activeWorld);
  const currentModeStats = useMemo(
    () => getChallengeModeStats(examLevelProgress, currentWorldIndex),
    [examLevelProgress, currentWorldIndex]
  );
  const currentWorldStats = useMemo(
    () => getChallengeWorldStats(examLevelProgress, currentWorldIndex),
    [examLevelProgress, currentWorldIndex]
  );
  const focusLevel = currentLevel ?? activeWorld.levels[0];
  const focusLevelIndex = activeWorld.levels.findIndex((level) => level.id === focusLevel?.id);
  const focusLevelAccessible =
    focusLevelIndex >= 0 && canAccessLevel(currentWorldIndex, focusLevelIndex, examLevelProgress);
  const focusLevelRecord = focusLevel ? examLevelProgress[focusLevel.id] : null;
  const focusRewardHint = getChallengeRewardHint(currentWorldIndex, focusLevel?.label ?? null, focusLevelAccessible);
  const completedEntry = bannerCompleted ? findLevelEntry(bannerCompleted) : null;
  const unlockedEntry = bannerUnlocked ? findLevelEntry(bannerUnlocked) : null;
  const watercolor = watercolorShapes[currentWorldIndex % watercolorShapes.length];

  const selectWorld = (nextIndex: number) => {
    if (!appConfig.challengeFreeSelectionEnabled && nextIndex !== sequentialWorldIndex) {
      return;
    }

    const normalizedIndex = (nextIndex + examWorlds.length) % examWorlds.length;
    setWorldIndexState(normalizedIndex);
    updateChallengeSession({ activeWorldId: examWorlds[normalizedIndex].id, selectedLevelId: null });
    persistNow();
  };

  const stepWorld = (direction: -1 | 1) => {
    selectWorld(currentWorldIndex + direction);
  };

  useEffect(() => {
    if (!appConfig.challengeFreeSelectionEnabled) {
      if (currentWorldIndex !== sequentialWorldIndex) {
        setWorldIndexState(sequentialWorldIndex);
      }
      return;
    }

    if (challengeSession.activeWorldId) {
      const targetIndex = examWorlds.findIndex((world) => world.id === challengeSession.activeWorldId);
      if (targetIndex >= 0 && targetIndex !== worldIndexState) {
        setWorldIndexState(targetIndex);
      }
    }
  }, [challengeSession.activeWorldId, currentWorldIndex, sequentialWorldIndex, worldIndexState]);

  if (!hydrated) {
    return <div className="py-10 text-sm text-slate-500">加载闯关进度中...</div>;
  }

  if (isChallengeUnavailable || !activeWorld) {
    return (
      <Card className="space-y-4" data-testid="challenge-empty-state">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-surge">闯关</p>
          <h3 className="mt-3 text-3xl font-black text-ink">当前无法生成闯关地图</h3>
        </div>
        <p className="max-w-3xl text-sm leading-7 text-slate-600">{examWorldsWarning ?? "闯关数据不可用。"}</p>
      </Card>
    );
  }

  return (
    <>
      <AnimatePresence>
        {progressOpen ? (
          <ProgressPanel
            open={progressOpen}
            onClose={() => setProgressOpen(false)}
            worldName={activeWorld.name}
            modeLabel={activeModeLabel}
            currentWorldIndex={currentWorldIndex}
            currentLevelLabel={currentLevelLabel}
          />
        ) : null}
      </AnimatePresence>
      <AnimatePresence>{mistakesOpen ? <MistakePanel open={mistakesOpen} onClose={() => setMistakesOpen(false)} /> : null}</AnimatePresence>
      <AnimatePresence>
        {modalLevelId ? (
          <ChallengeStageModal
            levelId={modalLevelId}
            onClose={() => setModalLevelId(null)}
            onLevelCompleted={(completedId, nextUnlockedId) => {
              setBannerCompleted(completedId);
              setBannerUnlocked(nextUnlockedId);
              setModalLevelId(null);
            }}
          />
        ) : null}
      </AnimatePresence>

      <div className="space-y-3" data-testid="challenge-mode-panel">
        <Card className={cn("overflow-hidden rounded-[2rem] border border-white/76 p-0 shadow-[0_22px_52px_rgba(148,163,184,0.18)] bg-gradient-to-br", activeWorld.surfaceClass)}>
          <div className="relative px-4 py-4">
            <div className={cn("pointer-events-none absolute inset-0 opacity-90", getSeasonGlowClass(activeWorld.season))} />
            <div className="pointer-events-none absolute inset-0">
              <div className={cn("absolute rounded-[999px] blur-2xl", watercolor[0], watercolor[1])} />
              <div className={cn("absolute rounded-[999px] blur-2xl", watercolor[2], watercolor[3])} />
              <div className={cn("absolute rounded-[999px] blur-2xl", watercolor[4], watercolor[5])} />
            </div>

            <div className="relative space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: palette.accentText }}>
                    {challengeCopy.heroEyebrow}
                  </p>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[2rem] font-black leading-none text-slate-950">{activeWorld.name}</h2>
                    <span
                      className="rounded-full px-3 py-1 text-[11px] font-bold"
                      style={{
                        color: palette.accentText,
                        background: `linear-gradient(145deg, ${palette.accentSurfaceStrong}, rgba(255,255,255,0.94))`
                      }}
                    >
                      {currentWorldIndex + 1}/{examWorlds.length}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">{activeModeLabel}模式</p>
                  <p className="max-w-[15rem] text-sm leading-6 text-slate-600">{activeWorld.subtitle}</p>
                  <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 pt-1">
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-10 w-10 rounded-full border border-white/82 bg-white/86 p-0 shadow-[0_10px_22px_rgba(148,163,184,0.12)]"
                      disabled={!appConfig.challengeFreeSelectionEnabled}
                      onClick={() => stepWorld(-1)}
                      aria-label="查看上一张地图"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="rounded-[1.2rem] border border-white/82 bg-white/84 px-3 py-2 shadow-[0_10px_24px_rgba(148,163,184,0.12)]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">切换地图</p>
                      <p className="mt-1 text-sm font-bold text-slate-900">{activeWorld.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {worldUnlocked ? "当前世界已进入正式闯关" : "可提前查看后续地图"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-10 w-10 rounded-full border border-white/82 bg-white/86 p-0 shadow-[0_10px_22px_rgba(148,163,184,0.12)]"
                      disabled={!appConfig.challengeFreeSelectionEnabled}
                      onClick={() => stepWorld(1)}
                      aria-label="查看下一张地图"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-9 rounded-full border border-white/82 bg-white/86 px-3 text-xs font-bold shadow-[0_10px_22px_rgba(148,163,184,0.12)]"
                      onClick={() => setProgressOpen(true)}
                    >
                      进度总览
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-9 rounded-full border border-white/82 bg-white/86 px-3 text-xs font-bold shadow-[0_10px_22px_rgba(148,163,184,0.12)]"
                      onClick={() => setMistakesOpen(true)}
                    >
                      错题库
                    </Button>
                  </div>
                </div>

                <div
                  className="rounded-[1.45rem] border border-white/82 bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(248,250,252,0.78))] px-3 py-3 shadow-[0_16px_32px_rgba(148,163,184,0.15)]"
                  style={{ minWidth: 120 }}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{challengeCopy.currentWorld}</p>
                  <p className="mt-2 text-2xl font-black text-slate-950">{currentWorldStats.completionPercent}%</p>
                  <p className="mt-1 text-xs text-slate-500">{currentWorldStats.clearedLevels}/{currentWorldStats.totalLevels} 关</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="rounded-[1.2rem] bg-[linear-gradient(145deg,rgba(255,255,255,0.9),rgba(248,250,252,0.82))] px-3 py-3 shadow-[0_14px_26px_rgba(148,163,184,0.13)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">总星数</p>
                  <p className="mt-1.5 text-lg font-black text-slate-900">{currentModeStats.totalStars}</p>
                </div>
                <div className="rounded-[1.2rem] bg-[linear-gradient(145deg,rgba(255,255,255,0.9),rgba(248,250,252,0.82))] px-3 py-3 shadow-[0_14px_26px_rgba(148,163,184,0.13)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">当前目标</p>
                  <p className="mt-1.5 text-lg font-black text-slate-900">第 {focusLevel?.label ?? currentLevelLabel} 关</p>
                </div>
                <div className="rounded-[1.2rem] bg-[linear-gradient(145deg,rgba(255,255,255,0.9),rgba(248,250,252,0.82))] px-3 py-3 shadow-[0_14px_26px_rgba(148,163,184,0.13)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">已解锁世界</p>
                  <p className="mt-1.5 text-lg font-black text-slate-900">{currentModeStats.unlockedWorlds}</p>
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-white/82 bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(248,250,252,0.8))] px-4 py-4 shadow-[0_16px_32px_rgba(148,163,184,0.16)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900">
                      {focusLevelAccessible ? `继续挑战 第 ${focusLevel?.label ?? currentLevelLabel} 关` : "当前世界预览中"}
                    </p>
                    <p className="text-sm text-slate-600">{focusRewardHint}</p>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                    style={{
                      color: focusLevelAccessible ? "#ffffff" : palette.accentText,
                      background: focusLevelAccessible
                        ? `linear-gradient(145deg, ${palette.accent}, ${palette.accentStrong})`
                        : `linear-gradient(145deg, ${palette.accentSurface}, rgba(255,255,255,0.94))`
                    }}
                  >
                    {focusLevelAccessible ? "继续" : "预览"}
                  </span>
                </div>

                <div className="mt-4 space-y-2.5">
                  <ProgressStrip
                    label="世界推进"
                    value={currentWorldStats.completionPercent}
                    summary={`${currentWorldStats.clearedLevels}/${currentWorldStats.totalLevels}`}
                    accent={palette.accent}
                    soft={palette.pathEnd}
                  />
                  <ProgressStrip
                    label="星级收集"
                    value={currentWorldStats.starPercent}
                    summary={`${currentWorldStats.totalStars}/${currentWorldStats.totalLevels * 3}`}
                    accent={palette.accentStrong}
                    soft={palette.pathEnd}
                  />
                </div>

                <div className="mt-4">
                  <Button
                    type="button"
                    className="challenge-shine h-12 w-full justify-between rounded-[1.35rem] px-4 text-sm font-bold text-white"
                    disabled={!focusLevelAccessible}
                    onClick={() => {
                      if (!focusLevelAccessible || !focusLevel) {
                        return;
                      }
                      updateChallengeSession({
                        activeWorldId: activeWorld.id,
                        selectedLevelId: focusLevel.id
                      });
                      persistNow();
                      setModalLevelId(focusLevel.id);
                    }}
                    style={{
                      background: `linear-gradient(145deg, ${palette.accent}, ${palette.accentStrong})`,
                      boxShadow: `0 16px 32px ${palette.glow}`
                    }}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      {focusLevelAccessible ? `继续挑战 第 ${focusLevel?.label ?? currentLevelLabel} 关` : "当前世界预览中"}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {(completedEntry || unlockedEntry) ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[1.4rem] border border-amber-200 bg-[linear-gradient(145deg,#fff5d1,#ffe6ab)] px-4 py-3 shadow-soft"
            data-testid="challenge-unlock-banner"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                {completedEntry ? (
                  <p className="text-sm font-semibold text-amber-700">
                    已完成 {completedEntry.world.name} 第 {completedEntry.level.label} 关
                  </p>
                ) : null}
                <p className="text-sm text-slate-600">
                  {unlockedEntry
                    ? `已解锁第 ${unlockedEntry.level.label} 关，等待你手动开启。`
                    : "地图进度已更新。"}
                </p>
              </div>
              <Sparkles className="h-5 w-5 text-amber-500" />
            </div>
          </motion.div>
        ) : null}

        <motion.div
          key={activeWorld.id}
          initial={{ opacity: 0.55, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
        >
          <Card className={cn("overflow-hidden rounded-[1.85rem] border border-white/76 p-0 shadow-[0_22px_50px_rgba(148,163,184,0.16)] bg-gradient-to-br", activeWorld.surfaceClass)}>
            <div className="relative px-3 py-4">
            <div className={cn("pointer-events-none absolute inset-0 opacity-90", getSeasonGlowClass(activeWorld.season))} />
            <div className="pointer-events-none absolute inset-0">
              <div className={cn("absolute rounded-[999px] blur-2xl", watercolor[0], watercolor[1])} />
              <div className={cn("absolute rounded-[999px] blur-2xl", watercolor[2], watercolor[3])} />
              <div className={cn("absolute rounded-[999px] blur-2xl", watercolor[4], watercolor[5])} />
            </div>

            <div className="relative mb-3 flex items-start justify-between gap-3 px-1">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: palette.accentText }}>
                  {challengeCopy.mapEyebrow}
                </p>
                <h3 className="mt-1 text-xl font-black text-slate-950">{activeWorld.name}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {worldUnlocked ? "跟着高亮节点继续推进" : "当前世界还未解锁，你看到的是预览地图"}
                </p>
              </div>
              <div className="rounded-[1.2rem] bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(248,250,252,0.8))] px-3 py-2 text-right shadow-[0_12px_24px_rgba(148,163,184,0.14)]">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">本世界星数</p>
                <p className="mt-1 text-lg font-black text-slate-900">{currentWorldStats.totalStars}</p>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[1.7rem] border border-white/64 bg-white/36 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
              <div className="h-[520px] overflow-y-auto px-3 pb-5 pt-4">
                <div className="relative mx-auto h-[880px] max-w-[312px] pt-7">
                  {activeWorld.levels.slice(0, -1).map((level, levelIndex) => {
                    const startX = NODE_X[levelIndex] + 24;
                    const startY = NODE_Y[levelIndex] + 24;
                    const endX = NODE_X[levelIndex + 1] + 24;
                    const endY = NODE_Y[levelIndex + 1] + 24;
                    const dx = endX - startX;
                    const dy = endY - startY;
                    const length = Math.sqrt(dx * dx + dy * dy);
                    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
                    const fromCleared = Boolean(examLevelProgress[level.id]?.cleared);
                    const guidesToCurrent = focusLevelAccessible && focusLevelIndex === levelIndex + 1;

                    return (
                      <div
                        key={`${activeWorld.id}-path-${level.id}`}
                        className={cn(
                          "absolute h-[7px] rounded-full",
                          fromCleared || guidesToCurrent
                            ? "challenge-path-flow"
                            : "bg-[linear-gradient(90deg,#dbe2ea,#edf2f6)] opacity-70"
                        )}
                        style={{
                          left: startX,
                          top: startY,
                          width: length,
                          transform: `rotate(${angle}deg)`,
                          transformOrigin: "left center",
                          background:
                            fromCleared
                              ? `linear-gradient(90deg, ${palette.pathStart}, ${palette.pathEnd}, ${palette.pathStart})`
                              : guidesToCurrent
                                ? `linear-gradient(90deg, ${palette.accentSurfaceStrong}, ${palette.pathEnd}, ${palette.accentSurface})`
                                : undefined,
                          boxShadow: fromCleared ? `0 0 14px ${palette.glow}` : undefined
                        }}
                      />
                    );
                  })}

                  {activeWorld.levels.map((level, levelIndex) => {
                    const unlocked = worldUnlocked && getLevelUnlockState(currentWorldIndex, levelIndex, examLevelProgress);
                    const accessible = canAccessLevel(currentWorldIndex, levelIndex, examLevelProgress);
                    const cleared = Boolean(examLevelProgress[level.id]?.cleared);
                    const perfect = cleared && (examLevelProgress[level.id]?.bestStars ?? 0) === 3;
                    const current = currentLevel?.id === level.id;

                    return (
                      <button
                        key={level.id}
                        type="button"
                        onClick={() => {
                          if (!accessible) {
                            return;
                          }
                          updateChallengeSession({
                            activeWorldId: activeWorld.id,
                            selectedLevelId: level.id
                          });
                          persistNow();
                          setModalLevelId(level.id);
                        }}
                        data-testid="challenge-level-button"
                        data-level-id={level.id}
                        className="absolute flex flex-col items-center gap-2 transition-transform duration-150 active:scale-[0.96]"
                        style={{ left: NODE_X[levelIndex], top: NODE_Y[levelIndex] }}
                      >
                        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }} className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 3 }, (_, starIndex) => (
                            <Star
                              key={`${level.id}-${starIndex + 1}`}
                              className={cn(
                                "h-3 w-3 transition",
                                starIndex < (examLevelProgress[level.id]?.bestStars ?? 0)
                                  ? "fill-yellow-300 text-yellow-300 drop-shadow-[0_1px_2px_rgba(240,195,80,0.45)]"
                                  : "fill-white/55 text-slate-300"
                              )}
                              strokeWidth={1.7}
                            />
                          ))}
                        </div>
                        <div
                          className={cn(
                            "relative flex h-14 w-14 items-center justify-center rounded-full border-[3px] text-sm font-black transition",
                            buildNodeClass({ unlocked, cleared, current, perfect }),
                            current ? "challenge-node-current" : ""
                          )}
                        >
                          {current ? (
                            <span className="absolute inset-[-6px] rounded-full border border-sky-200/70 animate-pulse" aria-hidden="true" />
                          ) : null}
                          {perfect ? (
                            <span className="absolute -top-1.5 -right-1.5 rounded-full bg-amber-300 px-1.5 py-0.5 text-[9px] font-black text-amber-950 shadow-[0_8px_18px_rgba(245,158,11,0.24)]">
                              3☆
                            </span>
                          ) : null}
                          {cleared ? <Check className="h-5 w-5" /> : unlocked ? level.label : <Lock className="h-4 w-4" />}
                        </div>
                        <span className={cn(
                          "rounded-full px-2 py-1 text-[11px] font-semibold",
                          unlocked ? "bg-white/72 text-slate-600" : "bg-white/58 text-slate-400 ring-1 ring-slate-200/80"
                        )}>
                          关卡 {level.label}
                        </span>
                        </motion.div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            </div>
          </Card>
        </motion.div>

        <Card className="rounded-[1.8rem] border border-white/78 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(248,250,252,0.82))] shadow-[0_18px_44px_rgba(148,163,184,0.14)]">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: palette.accentText }}>
                  {challengeCopy.currentStageEyebrow}
                </p>
                <h3 className="mt-2 text-2xl font-black text-slate-950">第 {focusLevel?.label ?? currentLevelLabel} 关</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {focusLevelAccessible
                    ? `词条范围 ${focusLevel?.rangeLabel ?? "--"}，现在可以继续进入这一关。`
                    : worldUnlocked
                      ? "这关还未正式解锁，你可以先看地图上的推进路径。"
                      : "这个世界当前仅供预览，完成前一世界后会正式开放。"}
                </p>
              </div>
              <span
                className="rounded-full px-3 py-1 text-xs font-bold"
                style={{
                  color: focusLevelAccessible ? "#ffffff" : palette.accentText,
                  background: focusLevelAccessible
                    ? `linear-gradient(145deg, ${palette.accent}, ${palette.accentStrong})`
                    : `linear-gradient(145deg, ${palette.accentSurface}, rgba(255,255,255,0.94))`
                }}
              >
                {focusLevelAccessible ? "当前可挑战" : "预览"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-[1.15rem] bg-slate-50 px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{challengeCopy.bestStars}</p>
                <p className="mt-1.5 text-lg font-black text-slate-900">{focusLevelRecord?.bestStars ?? 0}</p>
              </div>
              <div className="rounded-[1.15rem] bg-slate-50 px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{challengeCopy.accuracy}</p>
                <p className="mt-1.5 text-lg font-black text-slate-900">{focusLevelRecord?.bestAccuracy ?? 0}%</p>
              </div>
              <div className="rounded-[1.15rem] bg-slate-50 px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{challengeCopy.currentWorld}</p>
                <p className="mt-1.5 text-lg font-black text-slate-900">{currentWorldIndex + 1}/{examWorlds.length}</p>
              </div>
            </div>

            <div
              className="rounded-[1.35rem] border px-4 py-4"
              style={{
                background: `linear-gradient(145deg, ${palette.accentSurface}, rgba(255,255,255,0.96))`,
                borderColor: palette.accentBorder
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-[1.1rem] text-white"
                  style={{ background: `linear-gradient(145deg, ${palette.accent}, ${palette.accentStrong})` }}
                >
                  <Flag className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">继续学下去会获得什么</p>
                  <p className="mt-1 text-sm text-slate-600">{focusRewardHint}</p>
                </div>
              </div>
            </div>

            <Button
              type="button"
              className="h-11 w-full justify-between rounded-[1.25rem] px-4 text-sm font-bold text-white"
              disabled={!focusLevelAccessible}
              onClick={() => {
                if (!focusLevelAccessible || !focusLevel) {
                  return;
                }
                updateChallengeSession({
                  activeWorldId: activeWorld.id,
                  selectedLevelId: focusLevel.id
                });
                persistNow();
                setModalLevelId(focusLevel.id);
              }}
              style={{
                background: `linear-gradient(145deg, ${palette.accent}, ${palette.accentStrong})`,
                boxShadow: `0 16px 32px ${palette.glow}`
              }}
            >
              <span className="inline-flex items-center gap-2">
                <Target className="h-4 w-4" />
                {focusLevelAccessible ? "进入当前关卡" : "等待解锁"}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
