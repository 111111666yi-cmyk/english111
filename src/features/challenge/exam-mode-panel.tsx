"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Lock,
  MapPinned,
  ScrollText,
  Sparkles,
  Star,
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
  getExamOverview,
  getExamStars,
  getExamWorldUnlockState
} from "@/lib/challenge-data";
import { createEmptyQuizSession } from "@/lib/quiz-session";
import { words } from "@/lib/content";
import { cn } from "@/lib/utils";
import { useLearningStore } from "@/stores/learning-store";
import {
  findLevelEntry,
  getCurrentPlayerLevel,
  getLevelUnlockState,
  getNextLevelId
} from "@/features/challenge/challenge-shared";

const NODE_Y = [74, 148, 222, 296, 370, 444, 518, 592, 666, 740, 814, 888];
const NODE_X = [76, 176, 104, 192, 84, 186, 94, 194, 82, 180, 104, 188];
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

const wordIndexById = new Map(words.map((word, index) => [word.id, index]));

function buildNodeClass({
  unlocked,
  cleared,
  current
}: {
  unlocked: boolean;
  cleared: boolean;
  current: boolean;
}) {
  if (!unlocked) {
    return "border-slate-300 bg-[linear-gradient(145deg,#d9dfe6,#eef2f7)] text-slate-400 shadow-[inset_5px_5px_10px_rgba(182,190,200,0.55),inset_-5px_-5px_10px_rgba(255,255,255,0.82)]";
  }

  if (current) {
    return "border-sky-200 bg-[linear-gradient(145deg,#98e6ff,#5f78f9)] text-white shadow-[9px_9px_18px_rgba(104,135,219,0.32),-8px_-8px_18px_rgba(255,255,255,0.82)]";
  }

  if (cleared) {
    return "border-emerald-200 bg-[linear-gradient(145deg,#e4ffe7,#94dfb2)] text-emerald-900 shadow-[8px_8px_18px_rgba(112,190,146,0.22),-8px_-8px_18px_rgba(255,255,255,0.82)]";
  }

  return "border-amber-200 bg-[linear-gradient(145deg,#fff8d9,#ffd378)] text-amber-950 shadow-[8px_8px_18px_rgba(221,180,72,0.22),-8px_-8px_18px_rgba(255,255,255,0.82)]";
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
  const simpleOverview = useMemo(() => getExamOverview(simpleProgress), [simpleProgress]);
  const hardOverview = useMemo(() => getExamOverview(hardProgress), [hardProgress]);

  if (!open) {
    return null;
  }

  return (
    <OverlayFrame onClose={onClose}>
      <Card className="space-y-4 rounded-[1.75rem]">
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

        <div className="grid gap-3">
          <Card className="space-y-3 rounded-[1.25rem]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ink">简单模式</p>
              <p className="text-xs text-slate-500">{simpleOverview.unlockedWorlds} 个世界已解锁</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
                当前世界进度：{Math.min(currentWorldIndex + 1, examWorlds.length)}/{examWorlds.length}
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
                关卡总数：{simpleOverview.clearedLevels}/{examWorlds.length * 12}
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
                世界星数：{simpleOverview.clearedWorlds}
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
                总星数：{simpleOverview.totalStars}
              </div>
            </div>
          </Card>

          <Card className="space-y-3 rounded-[1.25rem]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ink">困难模式</p>
              <p className="text-xs text-slate-500">{hardOverview.unlockedWorlds} 个世界已解锁</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
                当前世界进度：{Math.min(currentWorldIndex + 1, examWorlds.length)}/{examWorlds.length}
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
                关卡总数：{hardOverview.clearedLevels}/{examWorlds.length * 12}
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
                世界星数：{hardOverview.clearedWorlds}
              </div>
              <div className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
                总星数：{hardOverview.totalStars}
              </div>
            </div>
          </Card>
        </div>
      </Card>
    </OverlayFrame>
  );
}

function MistakePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const examMistakes = useLearningStore((state) => state.examMistakes);
  const mistakeWords = useMemo(
    () => examMistakes.map((id) => words.find((word) => word.id === id)).filter(Boolean),
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
  onLevelCompleted: (completedId: string, unlockedId: string | null) => void;
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

  const isUnlocked = getLevelUnlockState(levelEntry.worldIndex, levelEntry.levelIndex, examLevelProgress);
  if (!isUnlocked) {
    return null;
  }

  const activeQuizzes = levelEntry.level.words.map((word) =>
    getVocabularyQuiz(wordIndexById.get(word.id) ?? 0, activeMode)
  );
  const questionIndex = Math.min(challengeSession.questionIndex, Math.max(activeQuizzes.length - 1, 0));
  const currentQuiz = activeQuizzes[questionIndex] ?? null;
  const currentWord = levelEntry.level.words[questionIndex] ?? levelEntry.level.words[0];
  const answeredCount = Object.keys(challengeSession.results).length;
  const correctCount = Object.values(challengeSession.results).filter(Boolean).length;
  const accuracy = activeQuizzes.length ? Math.round((correctCount / activeQuizzes.length) * 100) : 0;
  const stars = getExamStars(accuracy);
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
    const nextLevelId = getNextLevelId(levelEntry.worldIndex, levelEntry.levelIndex);
    updateChallengeSession({
      activeWorldId: levelEntry.world.id,
      activeLevelId: null,
      selectedLevelId: nextLevelId ?? levelEntry.level.id,
      questionIndex: 0,
      results: {},
      saved: true,
      quiz: createEmptyQuizSession()
    });
    persistNow();
    onLevelCompleted(levelEntry.level.id, nextLevelId);
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
            <p className="text-lg font-semibold text-slate-700">{accuracy >= 60 ? "恭喜通关" : "再试试吧"}</p>
            <p className="text-base text-slate-600">正确率 {accuracy}%</p>
            <p className="text-sm text-slate-500">导入错题库：闯关答错题已写入专属错题库</p>
            <div className="flex items-center justify-center gap-3">
              <Button type="button" variant="secondary" onClick={closeToMap}>
                返回地图
              </Button>
              <Button type="button" onClick={finishLevel}>
                完成结算
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
  const firstUnlockedWorldIndex = Math.max(
    0,
    examWorlds.findIndex((_, index) => getExamWorldUnlockState(examLevelProgress, index))
  );
  const [worldIndexState, setWorldIndexState] = useState(firstUnlockedWorldIndex >= 0 ? firstUnlockedWorldIndex : 0);
  const currentWorldIndex = Math.min(worldIndexState, examWorlds.length - 1);
  const activeWorld = examWorlds[currentWorldIndex];
  const worldUnlocked = getExamWorldUnlockState(examLevelProgress, currentWorldIndex);
  const currentLevel = getCurrentPlayerLevel(currentWorldIndex, examLevelProgress, challengeSession.activeLevelId);
  const currentLevelLabel = currentLevel?.label ?? "1";
  const completedEntry = bannerCompleted ? findLevelEntry(bannerCompleted) : null;
  const unlockedEntry = bannerUnlocked ? findLevelEntry(bannerUnlocked) : null;
  const watercolor = watercolorShapes[currentWorldIndex % watercolorShapes.length];

  useEffect(() => {
    if (challengeSession.activeWorldId) {
      const targetIndex = examWorlds.findIndex((world) => world.id === challengeSession.activeWorldId);
      if (targetIndex >= 0 && targetIndex !== worldIndexState) {
        setWorldIndexState(targetIndex);
      }
    }
  }, [challengeSession.activeWorldId, worldIndexState]);

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
        <div className="space-y-2 text-center">
          <p className="text-sm font-semibold text-surge">闯关地图</p>
          <div className="flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="secondary"
              className="h-9 min-w-9 px-3"
              onClick={() => {
                const next = currentWorldIndex - 1 < 0 ? examWorlds.length - 1 : currentWorldIndex - 1;
                setWorldIndexState(next);
                updateChallengeSession({ activeWorldId: examWorlds[next].id, selectedLevelId: null });
                persistNow();
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="min-w-[140px] text-2xl font-black text-ink">{activeWorld.name}</h2>
            <Button
              type="button"
              variant="secondary"
              className="h-9 min-w-9 px-3"
              onClick={() => {
                const next = currentWorldIndex + 1 >= examWorlds.length ? 0 : currentWorldIndex + 1;
                setWorldIndexState(next);
                updateChallengeSession({ activeWorldId: examWorlds[next].id, selectedLevelId: null });
                persistNow();
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-slate-500">{activeModeLabel}模式</p>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Button type="button" variant="secondary" onClick={() => setMistakesOpen(true)}>
            错题库
          </Button>
          <Button type="button" variant="secondary" onClick={() => setProgressOpen(true)}>
            进度
          </Button>
        </div>

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
          <Card className={cn("overflow-hidden rounded-[1.75rem] p-0 bg-gradient-to-br", activeWorld.surfaceClass)}>
            <div className="relative px-4 py-5">
            <div className="pointer-events-none absolute inset-0">
              <div className={cn("absolute rounded-[999px] blur-2xl", watercolor[0], watercolor[1])} />
              <div className={cn("absolute rounded-[999px] blur-2xl", watercolor[2], watercolor[3])} />
              <div className={cn("absolute rounded-[999px] blur-2xl", watercolor[4], watercolor[5])} />
            </div>

            <div className="relative overflow-hidden rounded-[1.6rem] border border-white/60 bg-white/28">
              <div className="h-[620px] overflow-y-auto px-4 pb-6 pt-3">
                <div className="relative mx-auto h-[980px] max-w-[320px]">
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

                    return (
                      <div
                        key={`${activeWorld.id}-path-${level.id}`}
                        className={cn(
                          "absolute h-[6px] rounded-full",
                          fromCleared
                            ? `bg-gradient-to-r ${activeWorld.accentClass.replace("bg-", "from-")} to-yellow-300`
                            : "bg-[linear-gradient(90deg,#dbe2ea,#edf2f6)]"
                        )}
                        style={{
                          left: startX,
                          top: startY,
                          width: length,
                          transform: `rotate(${angle}deg)`,
                          transformOrigin: "left center"
                        }}
                      />
                    );
                  })}

                  {activeWorld.levels.map((level, levelIndex) => {
                    const unlocked = worldUnlocked && getLevelUnlockState(currentWorldIndex, levelIndex, examLevelProgress);
                    const cleared = Boolean(examLevelProgress[level.id]?.cleared);
                    const current = currentLevel?.id === level.id;

                    return (
                      <button
                        key={level.id}
                        type="button"
                        onClick={() => {
                          if (!unlocked) {
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
                            "flex h-12 w-12 items-center justify-center rounded-full border-[3px] text-sm font-black transition",
                            buildNodeClass({ unlocked, cleared, current })
                          )}
                        >
                          {cleared ? <Check className="h-5 w-5" /> : unlocked ? level.label : <Lock className="h-4 w-4" />}
                        </div>
                        <span className="rounded-full bg-white/72 px-2 py-1 text-[11px] font-semibold text-slate-600">
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
      </div>
    </>
  );
}
