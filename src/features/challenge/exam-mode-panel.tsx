"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Lock, PawPrint, Sparkles } from "lucide-react";
import { getVocabularyQuiz } from "@/data/quizzes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QuizCard } from "@/components/quiz-card";
import {
  type ExamLevel,
  examWorlds,
  examWorldsWarning,
  getExamOverview,
  getExamStars,
  getExamWorldUnlockState
} from "@/lib/challenge-data";
import { cn } from "@/lib/utils";
import { words } from "@/lib/content";
import { useLearningStore } from "@/stores/learning-store";
import type { ExamLevelRecord, WordEntry } from "@/types/content";

const wordIndexById = new Map(words.map((word, index) => [word.id, index]));

const mapNodeLayout = [
  { x: 96, y: 142 },
  { x: 236, y: 106 },
  { x: 392, y: 168 },
  { x: 550, y: 118 },
  { x: 710, y: 190 },
  { x: 876, y: 130 },
  { x: 1036, y: 258 },
  { x: 916, y: 342 },
  { x: 740, y: 320 },
  { x: 558, y: 374 },
  { x: 378, y: 330 },
  { x: 202, y: 384 }
] as const;

const worldThemeMap = {
  "world-1": {
    skyClass: "from-[#70d35c] via-[#b8ea8a] to-[#eef8c7]",
    surfaceClass: "from-[#d8f0b5] via-[#f2f7d2] to-[#fbf4e1]",
    accentClass: "bg-[#f5b52f]",
    landClass: "bg-[#83d86d]",
    terrain: ["草地坡岸", "云边溪流", "暖色山丘"]
  },
  "world-2": {
    skyClass: "from-[#f5bf5c] via-[#f9dc95] to-[#fef0d4]",
    surfaceClass: "from-[#f8db9e] via-[#f7e9ba] to-[#fcf4df]",
    accentClass: "bg-[#ff9746]",
    landClass: "bg-[#ebb35b]",
    terrain: ["流沙台地", "热风峡谷", "金色石丘"]
  },
  "world-3": {
    skyClass: "from-[#92d8ff] via-[#caf0ff] to-[#f4fdff]",
    surfaceClass: "from-[#cdeeff] via-[#ebf8ff] to-[#f7fdff]",
    accentClass: "bg-[#69a9ff]",
    landClass: "bg-[#9ee0ff]",
    terrain: ["雪冠山脊", "冰湖平原", "浮光云层"]
  },
  "world-4": {
    skyClass: "from-[#73cb8d] via-[#b7e7b8] to-[#f1faeb]",
    surfaceClass: "from-[#b8e8b5] via-[#daf1cf] to-[#f5fbef]",
    accentClass: "bg-[#2ea66c]",
    landClass: "bg-[#65c17d]",
    terrain: ["密林台阶", "树冠岛屿", "藤蔓山道"]
  },
  "world-5": {
    skyClass: "from-[#7fd8f5] via-[#b9f1ff] to-[#f3feff]",
    surfaceClass: "from-[#c6f2f8] via-[#e6fbff] to-[#f8feff]",
    accentClass: "bg-[#428ed8]",
    landClass: "bg-[#64cae8]",
    terrain: ["海湾桥岸", "浅滩小径", "风塔群岛"]
  },
  "world-6": {
    skyClass: "from-[#6988e7] via-[#93b7ff] to-[#e5eeff]",
    surfaceClass: "from-[#b2c5ff] via-[#d8e3ff] to-[#f2f6ff]",
    accentClass: "bg-[#4a5fda]",
    landClass: "bg-[#8193f4]",
    terrain: ["远港高塔", "水城坡道", "云桥节点"]
  },
  "world-7": {
    skyClass: "from-[#abd9ff] via-[#dcf2ff] to-[#f8fdff]",
    surfaceClass: "from-[#d7eeff] via-[#eef8ff] to-[#fbfeff]",
    accentClass: "bg-[#628ede]",
    landClass: "bg-[#a1c8ff]",
    terrain: ["寒雾坡谷", "冻原浅湖", "霜桥风口"]
  },
  "world-8": {
    skyClass: "from-[#bca3ff] via-[#e7daff] to-[#fcf7ff]",
    surfaceClass: "from-[#e0d1ff] via-[#f1e9ff] to-[#fcf7ff]",
    accentClass: "bg-[#8858e8]",
    landClass: "bg-[#c3a7ff]",
    terrain: ["暮色塔原", "镜面湖环", "高空阶路"]
  },
  "world-9": {
    skyClass: "from-[#7e8cff] via-[#9dd8ff] to-[#eef9ff]",
    surfaceClass: "from-[#c8d7ff] via-[#e0f5ff] to-[#f7feff]",
    accentClass: "bg-[#3658cc]",
    landClass: "bg-[#7fa6ff]",
    terrain: ["极光山海", "光幕裂谷", "终章主城"]
  }
} satisfies Record<
  string,
  {
    skyClass: string;
    surfaceClass: string;
    accentClass: string;
    landClass: string;
    terrain: string[];
  }
>;

type WorldTheme = (typeof worldThemeMap)[keyof typeof worldThemeMap];

function getLevelUnlockState(
  worldIndex: number,
  levelIndex: number,
  progress: Record<string, ExamLevelRecord>
) {
  const world = examWorlds[worldIndex];
  if (!world) {
    return false;
  }

  if (!getExamWorldUnlockState(progress, worldIndex)) {
    return false;
  }

  if (levelIndex === 0) {
    return true;
  }

  const previousLevel = world.levels[levelIndex - 1];
  return previousLevel ? Boolean(progress[previousLevel.id]?.cleared) : true;
}

function getFirstAvailableLevel(worldIndex: number, progress: Record<string, ExamLevelRecord>) {
  const world = examWorlds[worldIndex];
  if (!world) {
    return null;
  }

  return (
    world.levels.find((level, levelIndex) => getLevelUnlockState(worldIndex, levelIndex, progress)) ??
    world.levels[0]
  );
}

function getCurrentPlayerLevel(
  worldIndex: number,
  progress: Record<string, ExamLevelRecord>,
  activeLevelId: string | null
) {
  const world = examWorlds[worldIndex];
  if (!world) {
    return null;
  }

  if (activeLevelId) {
    return world.levels.find((level) => level.id === activeLevelId) ?? null;
  }

  const unclearedUnlocked = world.levels.find((level, levelIndex) => {
    return getLevelUnlockState(worldIndex, levelIndex, progress) && !progress[level.id]?.cleared;
  });

  return unclearedUnlocked ?? getFirstAvailableLevel(worldIndex, progress);
}

function buildPathSegments() {
  return mapNodeLayout.slice(0, -1).map((point, index) => {
    const next = mapNodeLayout[index + 1];
    const dx = next.x - point.x;
    const dy = next.y - point.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    return {
      id: `segment-${index + 1}`,
      left: point.x + 24,
      top: point.y + 24,
      width: length,
      angle
    };
  });
}

const pathSegments = buildPathSegments();

function buildNodeClass({
  unlocked,
  cleared,
  current,
  selected
}: {
  unlocked: boolean;
  cleared: boolean;
  current: boolean;
  selected: boolean;
}) {
  if (!unlocked) {
    return "border-slate-200 bg-slate-100 text-slate-400";
  }

  if (cleared) {
    return "border-[#ffe8a5] bg-gradient-to-br from-[#ffd76f] to-[#ffb533] text-slate-900 shadow-[0_14px_28px_rgba(255,196,78,0.32)]";
  }

  if (current) {
    return "border-white bg-gradient-to-br from-surge to-sky text-white shadow-[0_16px_32px_rgba(80,131,255,0.36)] animate-pulse";
  }

  if (selected) {
    return "border-[#9fc0ff] bg-white text-ink shadow-[0_16px_32px_rgba(77,120,255,0.16)] scale-105";
  }

  return "border-white bg-white text-ink shadow-soft";
}

function LevelPreviewCard({
  level,
  worldName,
  unlocked,
  record,
  onStart
}: {
  level: ExamLevel;
  worldName: string;
  unlocked: boolean;
  record?: ExamLevelRecord;
  onStart: () => void;
}) {
  return (
    <div
      className="rounded-[1.75rem] border border-white/70 bg-white/92 p-5 shadow-soft backdrop-blur"
      data-testid="challenge-node-preview"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-surge">{worldName}</p>
          <h3 className="mt-2 text-2xl font-black text-ink">第 {level.label} 关</h3>
          <p className="mt-2 text-sm text-slate-500">词汇范围 {level.rangeLabel}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-3 py-2 text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Stars</p>
          <p className="mt-1 text-lg font-black text-ink">{record?.bestStars ?? 0} / 3</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Words</p>
          <p className="mt-2 text-xl font-black text-ink">{level.words.length}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Accuracy</p>
          <p className="mt-2 text-xl font-black text-ink">{record?.bestAccuracy ?? 0}%</p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">State</p>
          <p className="mt-2 text-xl font-black text-ink">{unlocked ? "可挑战" : "未解锁"}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm leading-6 text-slate-500">
          通关要求是正确率高于 50%。60% / 75% / 90% 分别对应一星、二星、三星。
        </p>
        <Button
          type="button"
          onClick={onStart}
          disabled={!unlocked}
          data-testid="challenge-start-level"
        >
          {unlocked ? "开始这一关" : "等待解锁"}
        </Button>
      </div>
    </div>
  );
}

export function ExamModePanel() {
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const challengeSession = useLearningStore((state) => state.challengeSession);
  const examLevelProgress = useLearningStore((state) => state.examLevelProgress);
  const examMistakes = useLearningStore((state) => state.examMistakes);
  const recordExamWordResult = useLearningStore((state) => state.recordExamWordResult);
  const saveExamLevelProgress = useLearningStore((state) => state.saveExamLevelProgress);
  const logDailyProgress = useLearningStore((state) => state.logDailyProgress);
  const updateChallengeSession = useLearningStore((state) => state.updateChallengeSession);
  const resetChallengeSession = useLearningStore((state) => state.resetChallengeSession);

  const overview = useMemo(() => getExamOverview(examLevelProgress), [examLevelProgress]);

  const isChallengeUnavailable = Boolean(examWorldsWarning) || examWorlds.length === 0;
  const renderUnavailableState = () => {
    return (
      <Card className="space-y-4" data-testid="challenge-empty-state">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-surge">Challenge</p>
          <h3 className="mt-3 text-3xl font-black text-ink">闯关模式暂不可用</h3>
        </div>
        <p className="max-w-3xl text-sm leading-7 text-slate-600">
          当前词库数量还不足以生成完整的闯关地图。请先补充词库内容，再回来开启闯关进度。
        </p>
      </Card>
    );
  };

  const selectedWorld =
    examWorlds.find((world) => world.id === challengeSession.activeWorldId) ?? examWorlds[0] ?? null;

  const activeLevelEntry = useMemo(
    () =>
      examWorlds
        .flatMap((world) => world.levels.map((level) => ({ level, world })))
        .find((entry) => entry.level.id === challengeSession.activeLevelId) ?? null,
    [challengeSession.activeLevelId]
  );

  const activeWorld = activeLevelEntry?.world ?? selectedWorld;
  const activeWorldIndex = activeWorld
    ? examWorlds.findIndex((world) => world.id === activeWorld.id)
    : -1;
  const activeLevel = activeLevelEntry?.level ?? null;
  const theme = ((activeWorld ? worldThemeMap[activeWorld.id as keyof typeof worldThemeMap] : null) ??
    worldThemeMap["world-1"]) as WorldTheme;

  useEffect(() => {
    if (!activeWorld) {
      return;
    }

    if (challengeSession.activeWorldId !== activeWorld.id) {
      updateChallengeSession({ activeWorldId: activeWorld.id });
    }
  }, [activeWorld, challengeSession.activeWorldId, updateChallengeSession]);

  useEffect(() => {
    if (!activeWorld || activeWorldIndex < 0 || activeLevel) {
      return;
    }

    const defaultLevel = getFirstAvailableLevel(activeWorldIndex, examLevelProgress);
    if (
      defaultLevel &&
      (!selectedLevelId || !activeWorld.levels.some((level) => level.id === selectedLevelId))
    ) {
      setSelectedLevelId(defaultLevel.id);
    }
  }, [activeLevel, activeWorld, activeWorldIndex, examLevelProgress, selectedLevelId]);

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

  const examMistakeEntries = useMemo(
    () =>
      examMistakes
        .map((wordId) => words.find((word) => word.id === wordId))
        .filter((item): item is WordEntry => Boolean(item))
        .slice(0, 15),
    [examMistakes]
  );

  const selectedLevel =
    activeWorld?.levels.find((level) => level.id === selectedLevelId) ??
    (activeWorldIndex >= 0 ? getFirstAvailableLevel(activeWorldIndex, examLevelProgress) : null);

  if (!selectedLevel) {
    return (
      <Card className="space-y-4" data-testid="challenge-empty-state">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-surge">Challenge</p>
          <h3 className="mt-3 text-3xl font-black text-ink">当前世界还没有可用关卡</h3>
        </div>
        <p className="max-w-3xl text-sm leading-7 text-slate-600">
          当前世界尚未生成可挑战的关卡，请检查题库数据后再试。
        </p>
      </Card>
    );
  }

  const selectedLevelIndex =
    activeWorld && selectedLevel
      ? activeWorld.levels.findIndex((level) => level.id === selectedLevel.id)
      : -1;
  const selectedLevelUnlocked =
    selectedLevelIndex >= 0
      ? getLevelUnlockState(activeWorldIndex, selectedLevelIndex, examLevelProgress)
      : false;

  const currentPlayerLevel =
    activeWorldIndex >= 0
      ? getCurrentPlayerLevel(activeWorldIndex, examLevelProgress, challengeSession.activeLevelId)
      : null;

  const worldStars =
    activeWorld?.levels.reduce((total, level) => {
      return total + (examLevelProgress[level.id]?.bestStars ?? 0);
    }, 0) ?? 0;

  if (isChallengeUnavailable || !activeWorld) {
    return renderUnavailableState();
  }

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
        <Card className={cn("overflow-hidden bg-gradient-to-br", theme.surfaceClass)}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-surge">
                {activeWorld.name} · 第 {activeLevel.label} 关
              </p>
              <h3 className="text-2xl font-black text-ink md:text-3xl">
                词汇范围 {activeLevel.rangeLabel}
              </h3>
              <p className="max-w-3xl text-sm leading-7 text-slate-600">
                本关共 {activeLevel.words.length} 个词。无论答对还是答错，都会自动切到下一题；整关正确率高于
                50% 才算通关。
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

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-white/85 p-4">
              <p className="text-sm text-slate-500">作答进度</p>
              <p className="mt-2 text-4xl font-black text-ink" data-testid="challenge-current-index">
                {Math.min(challengeSession.questionIndex + 1, activeQuizzes.length)} / {activeQuizzes.length}
              </p>
            </div>
            <div className="rounded-3xl bg-white/85 p-4">
              <p className="text-sm text-slate-500">当前正确率</p>
              <p className="mt-2 text-4xl font-black text-ink">{accuracy}%</p>
            </div>
            <div className="rounded-3xl bg-white/85 p-4">
              <p className="text-sm text-slate-500">当前星级</p>
              <p className="mt-2 text-4xl font-black text-ink">{stars} 星</p>
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
              <Button type="button" variant="ghost" onClick={leaveLevel}>
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

      <Card
        className={cn("overflow-hidden border-white/70 bg-gradient-to-br p-0", theme.skyClass)}
        data-testid="challenge-world-map"
        data-world-id={activeWorld.id}
      >
        <div className="relative overflow-hidden p-5 md:p-7">
          <div className="absolute inset-0 opacity-70">
            <div className="absolute left-8 top-6 h-16 w-24 rounded-full bg-white/55 blur-xl" />
            <div className="absolute right-16 top-12 h-20 w-28 rounded-full bg-white/60 blur-xl" />
            <div className="absolute left-1/3 top-10 h-12 w-16 rounded-full bg-white/45 blur-lg" />
            <div className={cn("absolute bottom-8 left-4 h-36 w-36 rounded-full blur-3xl", theme.landClass)} />
            <div className={cn("absolute -right-12 bottom-0 h-48 w-48 rounded-full blur-3xl", theme.landClass)} />
          </div>

          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="inline-flex rounded-full bg-white/55 px-4 py-2 text-sm font-semibold text-surge backdrop-blur">
                World {activeWorldIndex + 1}
              </div>
              <div>
                <h3 className="text-3xl font-black text-ink md:text-4xl">{activeWorld.name}</h3>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">{activeWorld.subtitle}</p>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{activeWorld.description}</p>
              </div>
            </div>

            <div className="rounded-[1.75rem] bg-white/78 px-5 py-4 text-right ring-1 ring-white/70">
              <p className="text-sm text-slate-500">
                {getExamWorldUnlockState(examLevelProgress, activeWorldIndex) ? "已解锁" : "尚未解锁"}
              </p>
              <p className="mt-2 text-3xl font-black text-ink">{worldStars} / 36 星</p>
            </div>
          </div>

          <div className="relative mt-6 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-end">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                {theme.terrain.map((item) => (
                  <span key={item} className="rounded-full bg-white/65 px-3 py-1.5 ring-1 ring-white/70">
                    {item}
                  </span>
                ))}
              </div>

              <div className="overflow-x-auto pb-2">
                <div className="relative h-[460px] min-w-[1240px] rounded-[2.5rem] border border-white/70 bg-white/28 px-8 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-sm">
                  <div className="absolute inset-0 overflow-hidden rounded-[2.5rem]">
                    <div className={cn("absolute left-16 top-10 h-28 w-64 rounded-[999px] opacity-85 blur-sm", theme.landClass)} />
                    <div className={cn("absolute left-[24%] bottom-12 h-24 w-52 rounded-[999px] opacity-75 blur-sm", theme.landClass)} />
                    <div className={cn("absolute right-24 top-24 h-32 w-64 rounded-[999px] opacity-85 blur-sm", theme.landClass)} />
                    <div className={cn("absolute right-[18%] bottom-16 h-24 w-56 rounded-[999px] opacity-75 blur-sm", theme.landClass)} />
                    <div className="absolute left-[17%] top-[35%] h-16 w-28 rounded-full bg-white/35 blur-xl" />
                    <div className="absolute right-[30%] top-[20%] h-12 w-24 rounded-full bg-white/30 blur-xl" />
                    <div className="absolute left-[8%] bottom-[12%] h-24 w-24 rounded-full bg-white/10" />
                    <div className="absolute right-[10%] bottom-[10%] h-20 w-36 rounded-[999px] bg-white/14" />
                  </div>

                  {pathSegments.map((segment) => (
                    <div
                      key={segment.id}
                      className="absolute h-[10px] rounded-full bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.92)_0_18px,rgba(255,255,255,0)_18px_28px)] opacity-80"
                      style={{
                        left: `${segment.left}px`,
                        top: `${segment.top}px`,
                        width: `${segment.width}px`,
                        transform: `rotate(${segment.angle}deg)`,
                        transformOrigin: "left center",
                        boxShadow: "0 0 0 3px rgba(255,255,255,0.24)"
                      }}
                    />
                  ))}

                  {activeWorld.levels.map((level, levelIndex) => {
                    const layout = mapNodeLayout[levelIndex];
                    const record = examLevelProgress[level.id];
                    const unlocked = getLevelUnlockState(activeWorldIndex, levelIndex, examLevelProgress);
                    const cleared = Boolean(record?.cleared);
                    const current = currentPlayerLevel?.id === level.id;
                    const selected = selectedLevel.id === level.id;

                    return (
                      <button
                        key={level.id}
                        type="button"
                        onClick={() => {
                          if (!unlocked) {
                            return;
                          }
                          setSelectedLevelId(level.id);
                        }}
                        disabled={!unlocked}
                        data-testid="challenge-level-button"
                        data-level-id={level.id}
                        className="absolute flex flex-col items-center"
                        style={{ left: `${layout.x}px`, top: `${layout.y}px` }}
                      >
                        <div className="mb-2 flex gap-1">
                          {Array.from({ length: 3 }, (_, starIndex) => (
                            <span
                              key={`${level.id}-star-${starIndex + 1}`}
                              className={cn(
                                "h-3 w-3 rounded-full",
                                starIndex < (record?.bestStars ?? 0) ? "bg-yellow-300" : "bg-slate-300/85"
                              )}
                            />
                          ))}
                        </div>

                        <div className="relative">
                          {current ? (
                            <div className="absolute -left-4 -top-7 flex items-center gap-1 rounded-full bg-white/88 px-2 py-1 text-[11px] font-bold text-ink shadow-soft">
                              <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-ink text-white">
                                <PawPrint className="h-3.5 w-3.5" />
                                <span className="absolute -left-0.5 -top-1 h-2 w-2 rounded-full border border-white bg-ink" />
                                <span className="absolute -right-0.5 -top-1 h-2 w-2 rounded-full border border-white bg-ink" />
                              </span>
                              当前位置
                            </div>
                          ) : null}

                          <div
                            className={cn(
                              "flex h-14 w-14 items-center justify-center rounded-full border-[3px] text-lg font-black transition",
                              buildNodeClass({ unlocked, cleared, current, selected })
                            )}
                          >
                            {cleared ? (
                              <Check className="h-6 w-6" />
                            ) : unlocked ? (
                              level.label
                            ) : (
                              <Lock className="h-5 w-5" />
                            )}
                          </div>
                        </div>

                        <div className="mt-3 rounded-full bg-white/82 px-3 py-1.5 text-center text-xs font-semibold text-slate-600 shadow-soft">
                          <span className="block">第 {level.label} 关</span>
                          <span className="mt-1 block text-[11px] text-slate-500">{level.rangeLabel}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <LevelPreviewCard
              level={selectedLevel}
              worldName={activeWorld.name}
              unlocked={selectedLevelUnlocked}
              record={examLevelProgress[selectedLevel.id]}
              onStart={() => startLevel(selectedLevel.id)}
            />
          </div>

          <div className="relative mt-6 flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700">切换世界</p>
              <div className="flex flex-wrap gap-2" data-testid="challenge-world-switcher">
                {examWorlds.map((world, index) => {
                  const unlocked = getExamWorldUnlockState(examLevelProgress, index);

                  return (
                    <button
                      key={world.id}
                      type="button"
                      disabled={!unlocked}
                      onClick={() => {
                        updateChallengeSession({ activeWorldId: world.id });
                        setSelectedLevelId(null);
                      }}
                      className={cn(
                        "rounded-full px-3 py-2 text-sm font-semibold transition",
                        world.id === activeWorld.id
                          ? "bg-ink text-white shadow-glass"
                          : "bg-white/85 text-slate-600 ring-1 ring-slate-200",
                        !unlocked && "cursor-not-allowed opacity-45"
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

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={resetChallengeSession}
                data-testid="challenge-reset-worlds"
              >
                回到第一世界
              </Button>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 text-sm font-semibold text-slate-600">
                <Sparkles className="h-4 w-4 text-surge" />
                横向滑动查看整张地图
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-ink">闯关错题库</p>
            <p className="text-sm text-slate-500">
              闯关里做错的词会单独留在这里，不会和普通复习池混在一起。
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
          <p className="text-sm text-slate-500">当前闯关错题库还是空的，可以放心开始推进。</p>
        )}
      </Card>
    </div>
  );
}
