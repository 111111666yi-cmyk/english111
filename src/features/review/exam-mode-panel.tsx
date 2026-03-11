"use client";

import { useMemo, useState } from "react";
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

  return examWorlds[worldIndex].levels[levelIndex - 1]
    ? Boolean(progress[examWorlds[worldIndex].levels[levelIndex - 1].id]?.cleared)
    : true;
}

export function ExamModePanel() {
  const [activeLevelId, setActiveLevelId] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  const examLevelProgress = useLearningStore((state) => state.examLevelProgress);
  const examMistakes = useLearningStore((state) => state.examMistakes);
  const recordExamWordResult = useLearningStore((state) => state.recordExamWordResult);
  const saveExamLevelProgress = useLearningStore((state) => state.saveExamLevelProgress);
  const logDailyProgress = useLearningStore((state) => state.logDailyProgress);

  const overview = useMemo(() => getExamOverview(examLevelProgress), [examLevelProgress]);
  const examMistakeEntries = useMemo(
    () =>
      examMistakes
        .map((wordId) => words.find((word) => word.id === wordId))
        .filter((item): item is WordEntry => Boolean(item))
        .slice(0, 15),
    [examMistakes]
  );

  const activeLevel = useMemo(
    () =>
      examWorlds
        .flatMap((world) => world.levels.map((level) => ({ level, world })))
        .find((entry) => entry.level.id === activeLevelId),
    [activeLevelId]
  );

  const activeQuizzes = useMemo(() => {
    if (!activeLevel) {
      return [];
    }

    return activeLevel.level.words.map((word) => getVocabularyQuiz(wordIndexById.get(word.id) ?? 0));
  }, [activeLevel]);

  const currentQuiz = activeQuizzes[questionIndex];
  const answeredCount = Object.keys(results).length;
  const correctCount = Object.values(results).filter(Boolean).length;
  const accuracy = activeQuizzes.length ? Math.round((correctCount / activeQuizzes.length) * 100) : 0;
  const stars = getExamStars(accuracy);
  const allAnswered = activeQuizzes.length > 0 && answeredCount === activeQuizzes.length;

  const startLevel = (levelId: string) => {
    setActiveLevelId(levelId);
    setQuestionIndex(0);
    setResults({});
    setSaved(false);
  };

  const leaveLevel = () => {
    setActiveLevelId(null);
    setQuestionIndex(0);
    setResults({});
    setSaved(false);
  };

  if (activeLevel && currentQuiz) {
    return (
      <div className="space-y-6">
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-surge">
                {activeLevel.world.name} · 第 {activeLevel.level.label} 关
              </p>
              <h3 className="mt-2 text-2xl font-black text-ink">
                词汇范围 {activeLevel.level.rangeLabel}
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                本关共 {activeLevel.level.words.length} 个单词。正确率超过 50% 才算通关。
              </p>
            </div>
            <Button type="button" variant="secondary" onClick={leaveLevel}>
              返回地图
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">作答进度</p>
              <p className="mt-2 text-3xl font-black text-ink">
                {answeredCount} / {activeQuizzes.length}
              </p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">当前正确率</p>
              <p className="mt-2 text-3xl font-black text-ink">{accuracy}%</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">当前星级</p>
              <p className="mt-2 text-3xl font-black text-ink">{stars} 星</p>
            </div>
          </div>
        </Card>

        <QuizCard
          quiz={currentQuiz}
          variant="exam"
          onResult={(correct) => {
            if (results[currentQuiz.id] !== undefined) {
              return;
            }

            setResults((current) => ({
              ...current,
              [currentQuiz.id]: correct
            }));
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

        <div className="flex flex-wrap justify-between gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setQuestionIndex((current) => (current - 1 < 0 ? activeQuizzes.length - 1 : current - 1))
            }
          >
            上一题
          </Button>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setQuestionIndex((current) => (current + 1 >= activeQuizzes.length ? 0 : current + 1))
              }
            >
              下一题
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (!allAnswered || saved) {
                  return;
                }

                saveExamLevelProgress(activeLevel.level.id, accuracy, stars);
                setSaved(true);
              }}
              disabled={!allAnswered || saved}
            >
              {saved ? "本关已结算" : "完成本关"}
            </Button>
          </div>
        </div>

        {allAnswered ? (
          <Card className="space-y-3 bg-white/90">
            <p className="text-lg font-bold text-ink">本关结算</p>
            <p className="text-sm leading-6 text-slate-500">
              正确率 {accuracy}%。
              {accuracy > 50
                ? ` 已满足通关条件，并拿到 ${stars} 星。`
                : " 还没有达到通关条件，可以直接重打一遍。"}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setQuestionIndex(0);
                  setResults({});
                  setSaved(false);
                }}
              >
                重打本关
              </Button>
              {saved ? (
                <Button type="button" onClick={leaveLevel}>
                  回到地图
                </Button>
              ) : null}
            </div>
          </Card>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          <p className="text-sm text-slate-500">累计星星</p>
          <p className="mt-2 text-4xl font-black text-ink">{overview.totalStars}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">考试错题</p>
          <p className="mt-2 text-4xl font-black text-ink">{examMistakes.length}</p>
        </Card>
      </div>

      <Card className="space-y-3 bg-white/80">
        <p className="text-base font-semibold text-ink">考试模式说明</p>
        <p className="text-sm leading-6 text-slate-500">
          地图闯关只取前 3500 个词汇，每个世界 12 关。关卡正确率超过 50% 才能继续，星级按
          60% / 75% / 90% 逐级提升。考试错题不会进入普通复习池，而是单独留在考试错题库。
        </p>
      </Card>

      <div className="space-y-5">
        {examWorlds.map((world, worldIndex) => {
          const unlocked = getExamWorldUnlockState(examLevelProgress, worldIndex);
          const worldStars = world.levels.reduce(
            (total, level) => total + (examLevelProgress[level.id]?.bestStars ?? 0),
            0
          );
          const Icon = world.icon;

          return (
            <Card
              key={world.id}
              className={cn(
                "overflow-hidden bg-gradient-to-br",
                world.surfaceClass,
                !unlocked && "opacity-70"
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-3xl text-white shadow-glass",
                      world.accentClass
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-surge">World {worldIndex + 1}</p>
                    <h3 className="mt-1 text-2xl font-black text-ink">{world.name}</h3>
                    <p className="mt-2 text-sm text-slate-600">{world.subtitle}</p>
                    <p className="mt-1 text-sm text-slate-500">{world.description}</p>
                  </div>
                </div>
                <div className="rounded-3xl bg-white/80 px-4 py-3 text-right ring-1 ring-white/70">
                  <p className="text-sm text-slate-500">{unlocked ? "已解锁" : "尚未解锁"}</p>
                  <p className="mt-1 text-lg font-bold text-ink">{worldStars} / 36 星</p>
                </div>
              </div>

              <div className="relative mt-6 rounded-[2rem] bg-white/70 p-5">
                <div className="absolute left-8 right-8 top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-200/80" />
                <div className="grid gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
                  {world.levels.map((level, levelIndex) => {
                    const record = examLevelProgress[level.id];
                    const starsCount = record?.bestStars ?? 0;
                    const levelUnlocked = getLevelUnlockState(worldIndex, levelIndex, examLevelProgress);

                    return (
                      <div
                        key={level.id}
                        className={cn(
                          "relative flex flex-col items-center",
                          levelIndex % 2 === 0 ? "-translate-y-1" : "translate-y-3"
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
            </Card>
          );
        })}
      </div>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-ink">考试错题库</p>
            <p className="text-sm text-slate-500">考试里做错的词会独立留在这里，不会和普通复习池混在一起。</p>
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
          <p className="text-sm text-slate-500">当前考试错题库还是空的，可以放心开始闯关。</p>
        )}
      </Card>
    </div>
  );
}
