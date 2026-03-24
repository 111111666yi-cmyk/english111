"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { QuizCard } from "@/components/quiz-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getVocabularyQuiz } from "@/data/quizzes";
import { withBasePath } from "@/lib/base-path";
import { createEmptyQuizSession } from "@/lib/quiz-session";
import { Shell } from "@/components/shell";
import { releaseWordIndexById } from "@/lib/content";
import { useLearningStore } from "@/stores/learning-store";
import { canAccessLevel, findLevelEntry, getNextLevelId } from "@/features/challenge/challenge-shared";
import { getExamStars } from "@/lib/challenge-data";

export function ChallengeLevelScreen({ levelId }: { levelId: string }) {
  const router = useRouter();
  const hydrated = useLearningStore((state) => state.hydrated);
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
    if (!hydrated || !levelEntry) {
      return;
    }

    if (
      challengeSession.activeLevelId !== levelEntry.level.id ||
      challengeSession.activeWorldId !== levelEntry.world.id
    ) {
      updateChallengeSession({
        activeWorldId: levelEntry.world.id,
        activeLevelId: levelEntry.level.id,
        selectedLevelId: levelEntry.level.id,
        questionIndex: 0,
        results: {},
        saved: false,
        quiz: createEmptyQuizSession()
      });
    }
  }, [challengeSession.activeLevelId, challengeSession.activeWorldId, hydrated, levelEntry, updateChallengeSession]);

  const isUnlocked = levelEntry
    ? canAccessLevel(levelEntry.worldIndex, levelEntry.levelIndex, examLevelProgress)
    : false;

  const activeQuizzes = useMemo(() => {
    if (!levelEntry) {
      return [];
    }

    return levelEntry.level.words.map((word) =>
      getVocabularyQuiz(releaseWordIndexById.get(word.id) ?? 0, activeMode)
    );
  }, [activeMode, levelEntry]);

  const currentQuiz =
    activeQuizzes.length > 0 && challengeSession.questionIndex < activeQuizzes.length
      ? activeQuizzes[challengeSession.questionIndex]
      : null;

  const answeredCount = Object.keys(challengeSession.results).length;
  const correctCount = Object.values(challengeSession.results).filter(Boolean).length;
  const accuracy = activeQuizzes.length ? Math.round((correctCount / activeQuizzes.length) * 100) : 0;
  const stars = getExamStars(accuracy);
  const cleared = accuracy >= 50;
  const allAnswered = activeQuizzes.length > 0 && answeredCount >= activeQuizzes.length;

  useEffect(() => {
    if (!hydrated || !levelEntry || !allAnswered || challengeSession.saved) {
      return;
    }

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

    window.setTimeout(() => {
      persistNow();
      const challengePath =
        cleared
          ? `/challenge?completed=${levelEntry.level.id}${nextLevelId ? `&unlocked=${nextLevelId}` : ""}`
          : "/challenge";
      router.replace(withBasePath(challengePath) ?? challengePath);
    }, 700);
  }, [
    accuracy,
    cleared,
    allAnswered,
    challengeSession.saved,
    hydrated,
    levelEntry,
    persistNow,
    router,
    saveExamLevelProgress,
    stars,
    updateChallengeSession
  ]);

  if (!hydrated) {
    return (
      <Shell>
        <div className="py-10 text-sm text-slate-500">加载闯关进度中...</div>
      </Shell>
    );
  }

  if (!levelEntry) {
    return (
      <Shell>
        <Card className="space-y-4">
          <h2 className="text-2xl font-black text-ink">未找到关卡</h2>
          <Link href="/challenge" onClick={() => persistNow()}>
            <Button variant="secondary">返回地图</Button>
          </Link>
        </Card>
      </Shell>
    );
  }

  if (!isUnlocked) {
    return (
      <Shell>
        <Card className="space-y-4">
          <h2 className="text-2xl font-black text-ink">关卡未解锁</h2>
          <p className="text-sm text-slate-500">请先回到地图完成前置关卡。</p>
          <Link href="/challenge" onClick={() => persistNow()}>
            <Button variant="secondary">返回地图</Button>
          </Link>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-4" data-testid="challenge-level-screen">
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              persistNow();
              const challengePath = withBasePath("/challenge") ?? "/challenge";
              router.push(challengePath);
            }}
            data-testid="challenge-back-to-map"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            返回地图
          </Button>
          <div className="text-right">
            <p className="text-sm font-semibold text-surge">{levelEntry.world.name}</p>
            <p className="text-sm text-slate-500">
              第 {levelEntry.level.label} 关 · {activeMode === "simple" ? "简单模式" : "困难模式"}
            </p>
          </div>
        </div>

        <Card className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-sm text-slate-500">关卡</p>
              <p className="mt-2 text-3xl font-black text-ink">{levelEntry.level.label}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-sm text-slate-500">当前进度</p>
              <p className="mt-2 text-3xl font-black text-ink" data-testid="challenge-current-index">
                {Math.min(challengeSession.questionIndex + 1, activeQuizzes.length)} / {activeQuizzes.length}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-sm text-slate-500">星数</p>
              <p className="mt-2 text-3xl font-black text-ink">{stars}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            词条范围：{levelEntry.level.rangeLabel} · 正确率：{accuracy}%
          </div>
        </Card>

        {currentQuiz ? (
          <QuizCard
            quiz={currentQuiz}
            variant="challenge"
            autoAdvance="always"
            sessionState={challengeSession.quiz}
            onSessionStateChange={updateChallengeQuizSession}
            onAdvance={() => {
              const nextIndex = challengeSession.questionIndex + 1;
              updateChallengeSession({
                questionIndex: nextIndex >= activeQuizzes.length ? activeQuizzes.length : nextIndex,
                quiz: createEmptyQuizSession()
              });
              persistNow();
            }}
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
          />
        ) : (
          <Card>
            <p className="text-sm text-slate-500">正在准备本关题目...</p>
          </Card>
        )}
      </div>
    </Shell>
  );
}
