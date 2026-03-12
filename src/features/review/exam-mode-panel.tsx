"use client";

import { useEffect, useMemo } from "react";
import { getVocabularyQuiz } from "@/data/quizzes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QuizCard } from "@/components/quiz-card";
import {
  examWorlds,
  getExamOverview,
  getExamStars,
  getExamWorldUnlockState
} from "@/lib/challenge-data";
import { cn } from "@/lib/utils";
import { words } from "@/lib/content";
import { useLearningStore } from "@/stores/learning-store";
import type { ExamLevelRecord, WordEntry } from "@/types/content";

const wordIndexById = new Map(words.map((word, index) => [word.id, index]));

function getLevelUnlockState(
  worldIndex: number,
  levelIndex: number,
  progress: Record<string, ExamLevelRecord>
) {
  if (!getExamWorldUnlockState(progress, worldIndex)) {
    return false;
  }

  if (levelIndex === 0) {
    return true;
  }

  const previousLevel = examWorlds[worldIndex].levels[levelIndex - 1];
  return previousLevel ? Boolean(progress[previousLevel.id]?.cleared) : true;
}

export function ExamModePanel() {
  const challengeSession = useLearningStore((state) => state.challengeSession);
  const examLevelProgress = useLearningStore((state) => state.examLevelProgress);
  const examMistakes = useLearningStore((state) => state.examMistakes);
  const recordExamWordResult = useLearningStore((state) => state.recordExamWordResult);
  const saveExamLevelProgress = useLearningStore((state) => state.saveExamLevelProgress);
  const logDailyProgress = useLearningStore((state) => state.logDailyProgress);
  const updateChallengeSession = useLearningStore((state) => state.updateChallengeSession);
  const resetChallengeSession = useLearningStore((state) => state.resetChallengeSession);

  const overview = useMemo(() => getExamOverview(examLevelProgress), [examLevelProgress]);

  const selectedWorld =
    examWorlds.find((world) => world.id === challengeSession.activeWorldId) ?? examWorlds[0];

  const activeLevelEntry = useMemo(
    () =>
      examWorlds
        .flatMap((world) => world.levels.map((level) => ({ level, world })))
        .find((entry) => entry.level.id === challengeSession.activeLevelId) ?? null,
    [challengeSession.activeLevelId]
  );

  const activeWorld = activeLevelEntry?.world ?? selectedWorld;
  const activeWorldIndex = examWorlds.findIndex((world) => world.id === activeWorld.id);
  const activeLevel = activeLevelEntry?.level ?? null;

  useEffect(() => {
    if (challengeSession.activeWorldId !== activeWorld.id) {
      updateChallengeSession({ activeWorldId: activeWorld.id });
    }
  }, [activeWorld.id, challengeSession.activeWorldId, updateChallengeSession]);

  const activeQuizzes = useMemo(() => {
    if (!activeLevel) {
      return [];
    }

    return activeLevel.words.map((word) => getVocabularyQuiz(wordIndexById.get(word.id) ?? 0));
  }, [activeLevel]);

  const currentQuiz =
    activeQuizzes.length > 0 && challengeSession.questionIndex < activeQuizzes.length
      ? activeQuizzes[challengeSession.questionIndex]
      : null;

  const answeredCount = Object.keys(challengeSession.results).length;
  const correctCount = Object.values(challengeSession.results).filter(Boolean).length;
  const accuracy = activeQuizzes.length ? Math.round((correctCount / activeQuizzes.length) * 100) : 0;
  const stars = getExamStars(accuracy);
  const allAnswered = activeQuizzes.length > 0 && answeredCount >= activeQuizzes.length;
  const activeLevelLabel = activeLevel ? `第 ${activeLevel.label} 关` : "";

  const examMistakeEntries = useMemo(
    () =>
      examMistakes
        .map((wordId) => words.find((word) => word.id === wordId))
        .filter((item): item is WordEntry => Boolean(item))
        .slice(0, 15),
    [examMistakes]
  );

  const worldStars = activeWorld.levels.reduce(
    (total, level) => total + (examLevelProgress[level.id]?.bestStars ?? 0),
    0
  );
  const ActiveWorldIcon = activeWorld.icon;

  const startLevel = (levelId: string) => {
    updateChallengeSession({
      activeWorldId: activeWorld.id,
      activeLevelId: levelId,
      questionIndex: 0,
      results: {},
      saved: false
    });
  };

  const leaveLevel = () => {
    updateChallengeSession({
      activeWorldId: activeWorld.id,
      activeLevelId: null,
      questionIndex: 0,
      results: {},
      saved: false
    });
  };

  if (activeLevel) {
    return (
      <div className="space-y-6" data-testid="challenge-mode-panel">
        <Card className={cn("overflow-hidden bg-gradient-to-br", activeWorld.surfaceClass)}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-surge">
                {activeWorld.name} · {activeLevelLabel}
              </p>
              <h3 className="mt-2 text-2xl font-black text-ink">
                词汇范围 {activeLevel.rangeLabel}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                本关共 {activeLevel.words.length} 个词。无论答对还是答错，都会自动切到下一题；
                整关正确率高于 50% 才算通关。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={leaveLevel}
                data-testid="challenge-back-to-map"
              >
                返回地图
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  updateChallengeSession({
                    questionIndex:
                      challengeSession.questionIndex <= 0
                        ? 0
                        : challengeSession.questionIndex - 1
                  })
                }
                disabled={challengeSession.questionIndex <= 0}
              >
                上一题
              </Button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-white/80 p-4">
              <p className="text-sm text-slate-500">作答进度</p>
              <p
                className="mt-2 text-3xl font-black text-ink"
                data-testid="challenge-current-index"
              >
                {Math.min(challengeSession.questionIndex + 1, activeQuizzes.length)} / {activeQuizzes.length}
              </p>
            </div>
            <div className="rounded-3xl bg-white/80 p-4">
              <p className="text-sm text-slate-500">当前正确率</p>
              <p className="mt-2 text-3xl font-black text-ink">{accuracy}%</p>
            </div>
            <div className="rounded-3xl bg-white/80 p-4">
              <p className="text-sm text-slate-500">当前星级</p>
              <p className="mt-2 text-3xl font-black text-ink">{stars} 星</p>
            </div>
          </div>
        </Card>

        {currentQuiz ? (
          <QuizCard
            quiz={currentQuiz}
            variant="challenge"
            autoAdvance="always"
            onAdvance={() => {
              const nextIndex = challengeSession.questionIndex + 1;
              updateChallengeSession({
                questionIndex: nextIndex >= activeQuizzes.length ? activeQuizzes.length : nextIndex
              });
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
            }}
          />
        ) : null}

        {allAnswered ? (
          <Card className="space-y-4" data-testid="challenge-summary">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-lg font-bold text-ink">本关结算</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  正确率 {accuracy}%。
                  {accuracy > 50
                    ? ` 已满足通关条件，并拿到 ${stars} 星。`
                    : " 还没有达到通关条件，可以马上重打一遍。"}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-50 px-4 py-3 text-right">
                <p className="text-sm text-slate-500">本关星级</p>
                <p className="mt-2 text-2xl font-black text-ink">{stars} 星</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => {
                  if (challengeSession.saved) {
                    return;
                  }

                  saveExamLevelProgress(activeLevel.id, accuracy, stars);
                  updateChallengeSession({ saved: true });
                }}
                disabled={challengeSession.saved}
              >
                {challengeSession.saved ? "本关已结算" : "保存本关结果"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  updateChallengeSession({
                    questionIndex: 0,
                    results: {},
                    saved: false
                  })
                }
              >
                重打本关
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={leaveLevel}
              >
                回到地图
              </Button>
            </div>
          </Card>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="challenge-mode-panel">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <p className="text-sm text-slate-500">已解锁世界</p>
          <p className="mt-2 text-4xl font-black text-ink">{overview.unlockedWorlds}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">已通关关卡</p>
          <p className="mt-2 text-4xl font-black text-ink">{overview.clearedLevels}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">累计星数</p>
          <p className="mt-2 text-4xl font-black text-ink">{overview.totalStars}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">闯关错题</p>
          <p className="mt-2 text-4xl font-black text-ink">{examMistakes.length}</p>
        </Card>
      </div>

      <Card className="space-y-3 bg-white/80">
        <p className="text-base font-semibold text-ink">闯关模式说明</p>
        <p className="text-sm leading-6 text-slate-500">
          闯关只使用前 3500 个核心词汇，分成 9 个世界、每个世界 12 关。关卡正确率高于
          50% 才能通关；60%、75%、90% 分别对应一星、二星、三星。进行中的题号、世界、关卡和本关结果都会按账户保存在本地。
        </p>
      </Card>

      <Card
        className={cn(
          "relative overflow-hidden bg-gradient-to-br p-0",
          activeWorld.surfaceClass
        )}
        data-testid="challenge-world-map"
        data-world-id={activeWorld.id}
      >
        <div className="relative overflow-hidden rounded-[2rem] p-6">
          <div className="pointer-events-none absolute inset-0 opacity-70">
            <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-white/45 blur-3xl" />
            <div className="absolute right-8 top-16 h-28 w-28 rounded-full bg-white/40 blur-2xl" />
            <div className="absolute bottom-10 left-1/3 h-24 w-24 rounded-full bg-white/35 blur-2xl" />
            <div className="absolute inset-x-10 bottom-20 h-px bg-white/70" />
          </div>

          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-3xl text-white shadow-glass",
                  activeWorld.accentClass
                )}
              >
                <ActiveWorldIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-surge">
                  World {activeWorldIndex + 1}
                </p>
                <h3 className="mt-1 text-3xl font-black text-ink">{activeWorld.name}</h3>
                <p className="mt-3 text-sm text-slate-600">{activeWorld.subtitle}</p>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                  {activeWorld.description}
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-white/80 px-4 py-3 text-right ring-1 ring-white/70">
              <p className="text-sm text-slate-500">
                {getExamWorldUnlockState(examLevelProgress, activeWorldIndex) ? "已解锁" : "尚未解锁"}
              </p>
              <p className="mt-1 text-lg font-bold text-ink">{worldStars} / 36 星</p>
            </div>
          </div>

          <div className="relative mt-6 rounded-[2rem] bg-white/70 p-5">
            <div className="absolute left-8 right-8 top-1/2 hidden h-1 -translate-y-1/2 rounded-full bg-slate-200/80 lg:block" />
            <div className="grid gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
              {activeWorld.levels.map((level, levelIndex) => {
                const record = examLevelProgress[level.id];
                const starsCount = record?.bestStars ?? 0;
                const levelUnlocked = getLevelUnlockState(activeWorldIndex, levelIndex, examLevelProgress);

                return (
                  <div
                    key={level.id}
                    className={cn(
                      "relative flex flex-col items-center",
                      levelIndex % 2 === 0 ? "lg:-translate-y-1" : "lg:translate-y-3"
                    )}
                  >
                    <div className="mb-2 flex gap-1">
                      {Array.from({ length: 3 }, (_, starIndex) => (
                        <span
                          key={`${level.id}-star-${starIndex + 1}`}
                          className={cn(
                            "h-2.5 w-2.5 rounded-full",
                            starIndex < starsCount ? "bg-yellow-400" : "bg-slate-300"
                          )}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled={!levelUnlocked}
                      onClick={() => startLevel(level.id)}
                      data-testid="challenge-level-button"
                      data-level-id={level.id}
                      className={cn(
                        "relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-4 text-base font-black transition",
                        record?.cleared
                          ? "border-white bg-gradient-to-br from-surge to-sky text-white shadow-glass"
                          : "border-white bg-white text-ink shadow-soft",
                        !levelUnlocked && "cursor-not-allowed bg-slate-100 text-slate-400"
                      )}
                    >
                      {level.label}
                    </button>
                    <p className="mt-2 text-xs font-semibold text-slate-600">{level.rangeLabel}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-600">切换世界</p>
              <div className="mt-3 flex flex-wrap gap-2" data-testid="challenge-world-switcher">
                {examWorlds.map((world, index) => {
                  const unlocked = getExamWorldUnlockState(examLevelProgress, index);
                  return (
                    <button
                      key={world.id}
                      type="button"
                      disabled={!unlocked}
                      onClick={() =>
                        updateChallengeSession({
                          activeWorldId: world.id
                        })
                      }
                      className={cn(
                        "rounded-full px-3 py-2 text-sm font-semibold transition",
                        world.id === activeWorld.id
                          ? "bg-ink text-white"
                          : "bg-white/85 text-slate-600 ring-1 ring-slate-200",
                        !unlocked && "cursor-not-allowed opacity-50"
                      )}
                      data-testid="challenge-world-switcher-button"
                      data-world-id={world.id}
                    >
                      W{index + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              onClick={resetChallengeSession}
              data-testid="challenge-reset-worlds"
            >
              回到第一世界
            </Button>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-ink">闯关错题库</p>
            <p className="text-sm text-slate-500">
              闯关里做错的词会独立留在这里，不会和普通复习池混在一起。
            </p>
          </div>
          <p className="text-sm font-semibold text-slate-500">共 {examMistakes.length} 个词</p>
        </div>
        {examMistakeEntries.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {examMistakeEntries.map((word) => (
              <div key={word.id} className="rounded-3xl bg-slate-50 px-4 py-4 ring-1 ring-slate-100">
                <p className="text-lg font-bold text-ink">{word.word}</p>
                <p className="mt-1 text-sm text-slate-500">{word.meaningZh}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">当前闯关错题库还是空的，可以放心开始闯关。</p>
        )}
      </Card>
    </div>
  );
}
