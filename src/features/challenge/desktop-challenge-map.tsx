"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Lock,
  Map,
  Sparkles,
  Star,
  Swords,
  Target,
  Trophy
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  examWorlds,
  examWorldsWarning,
  getExamOverview,
  getExamWorldUnlockState
} from "@/lib/challenge-data";
import { cn } from "@/lib/utils";
import { useLearningStore } from "@/stores/learning-store";
import {
  findLevelEntry,
  getCurrentPlayerLevel,
  getLevelUnlockState
} from "@/features/challenge/challenge-shared";

const DESKTOP_NODE_POSITIONS = [
  { left: "7%", top: "68%" },
  { left: "14%", top: "55%" },
  { left: "23%", top: "63%" },
  { left: "31%", top: "46%" },
  { left: "40%", top: "56%" },
  { left: "49%", top: "38%" },
  { left: "58%", top: "49%" },
  { left: "67%", top: "32%" },
  { left: "76%", top: "44%" },
  { left: "84%", top: "27%" },
  { left: "91%", top: "39%" },
  { left: "96%", top: "21%" }
] as const;

function nodeTone({
  unlocked,
  cleared,
  selected
}: {
  unlocked: boolean;
  cleared: boolean;
  selected: boolean;
}) {
  if (!unlocked) {
    return "border-slate-300 bg-white/70 text-slate-400 shadow-[0_10px_30px_rgba(148,163,184,0.12)]";
  }

  if (selected) {
    return "border-emerald-200 bg-[linear-gradient(145deg,#dcfce7,#86efac)] text-emerald-950 shadow-[0_18px_40px_rgba(34,197,94,0.25)]";
  }

  if (cleared) {
    return "border-sky-200 bg-[linear-gradient(145deg,#eff6ff,#93c5fd)] text-sky-950 shadow-[0_16px_36px_rgba(59,130,246,0.22)]";
  }

  return "border-amber-200 bg-[linear-gradient(145deg,#fef3c7,#fcd34d)] text-amber-950 shadow-[0_16px_36px_rgba(245,158,11,0.22)]";
}

export function DesktopChallengeMap({
  completedLevelId,
  unlockedLevelId
}: {
  completedLevelId?: string | null;
  unlockedLevelId?: string | null;
}) {
  const router = useRouter();
  const hydrated = useLearningStore((state) => state.hydrated);
  const activeMode = useLearningStore((state) => state.modeConfig.activeMode);
  const challengeSession = useLearningStore((state) => state.challengeSession);
  const examLevelProgress = useLearningStore((state) => state.examLevelProgress);
  const simpleProgress = useLearningStore((state) => state.modes.simple.examLevelProgress);
  const hardProgress = useLearningStore((state) => state.modes.hard.examLevelProgress);
  const examMistakes = useLearningStore((state) => state.examMistakes);
  const updateChallengeSession = useLearningStore((state) => state.updateChallengeSession);
  const persistNow = useLearningStore((state) => state.persistNow);

  const isChallengeUnavailable = Boolean(examWorldsWarning) || examWorlds.length === 0;
  const activeModeLabel = activeMode === "simple" ? "简单模式" : "困难模式";
  const simpleOverview = useMemo(() => getExamOverview(simpleProgress), [simpleProgress]);
  const hardOverview = useMemo(() => getExamOverview(hardProgress), [hardProgress]);

  const firstUnlockedWorldIndex = Math.max(
    0,
    examWorlds.findIndex((_, index) => getExamWorldUnlockState(examLevelProgress, index))
  );
  const [worldIndex, setWorldIndex] = useState(firstUnlockedWorldIndex >= 0 ? firstUnlockedWorldIndex : 0);

  useEffect(() => {
    if (!challengeSession.activeWorldId) {
      return;
    }

    const index = examWorlds.findIndex((world) => world.id === challengeSession.activeWorldId);
    if (index >= 0 && index !== worldIndex) {
      setWorldIndex(index);
    }
  }, [challengeSession.activeWorldId, worldIndex]);

  if (!hydrated) {
    return <div className="py-10 text-sm text-slate-500">加载闯关数据中...</div>;
  }

  if (isChallengeUnavailable) {
    return (
      <Card className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Challenge</p>
        <h2 className="text-3xl font-black text-ink">当前无法生成闯关地图</h2>
        <p className="text-sm leading-7 text-slate-600">{examWorldsWarning ?? "闯关数据暂不可用。"}</p>
      </Card>
    );
  }

  const activeWorld = examWorlds[worldIndex];
  const worldUnlocked = getExamWorldUnlockState(examLevelProgress, worldIndex);
  const currentLevel = getCurrentPlayerLevel(worldIndex, examLevelProgress, challengeSession.activeLevelId);
  const selectedLevel =
    (challengeSession.selectedLevelId &&
      findLevelEntry(challengeSession.selectedLevelId)?.world.id === activeWorld.id &&
      activeWorld.levels.find((level) => level.id === challengeSession.selectedLevelId)) ||
    currentLevel ||
    activeWorld.levels[0];
  const selectedLevelIndex = activeWorld.levels.findIndex((level) => level.id === selectedLevel?.id);
  const selectedUnlocked =
    selectedLevelIndex >= 0 && worldUnlocked
      ? getLevelUnlockState(worldIndex, selectedLevelIndex, examLevelProgress)
      : false;
  const selectedRecord = selectedLevel ? examLevelProgress[selectedLevel.id] : null;
  const completedEntry = completedLevelId ? findLevelEntry(completedLevelId) : null;
  const unlockedEntry = unlockedLevelId ? findLevelEntry(unlockedLevelId) : null;

  const openLevel = () => {
    if (!selectedLevel || !selectedUnlocked) {
      return;
    }

    updateChallengeSession({
      activeWorldId: activeWorld.id,
      activeLevelId: selectedLevel.id,
      selectedLevelId: selectedLevel.id
    });
    persistNow();
    router.push(`/challenge/level/${selectedLevel.id}`);
  };

  return (
    <div className="hidden gap-6 md:block" data-testid="desktop-challenge-map">
      <Card className="overflow-hidden border border-white/70 bg-[linear-gradient(145deg,#eefbf2,#f8fffb)] p-0">
        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.35fr_0.65fr] lg:px-7">
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-3 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 shadow-[0_10px_30px_rgba(16,185,129,0.12)]">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-sm font-black text-white">
                    EC
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-emerald-700">Challenge</p>
                    <p className="text-sm font-semibold text-slate-600">桌面专属闯关地图</p>
                  </div>
                </div>

                <div>
                  <h1 className="text-4xl font-black tracking-tight text-ink">CHALLENGE 闯关</h1>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                    保留手机端当前流程，桌面端恢复独立闯关页：大地图、世界切换、关卡选择和进度信息集中在同一屏。
                  </p>
                </div>
              </div>

              <div className="hidden items-center gap-2 xl:flex">
                <div className="rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600">
                  当前：{activeModeLabel}
                </div>
                <div className="rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600">
                  已解锁世界 {getExamOverview(examLevelProgress).unlockedWorlds}/{examWorlds.length}
                </div>
              </div>
            </div>

            {(completedEntry || unlockedEntry) ? (
              <div className="flex items-start justify-between gap-4 rounded-[1.5rem] border border-amber-200 bg-[linear-gradient(145deg,#fff8db,#ffefba)] px-5 py-4 shadow-[0_18px_36px_rgba(245,158,11,0.14)]">
                <div className="space-y-1">
                  {completedEntry ? (
                    <p className="text-sm font-semibold text-amber-800">
                      已完成 {completedEntry.world.name} 第 {completedEntry.level.label} 关
                    </p>
                  ) : null}
                  <p className="text-sm text-slate-700">
                    {unlockedEntry ? `新关卡已解锁：第 ${unlockedEntry.level.label} 关` : "地图进度已更新。"}
                  </p>
                </div>
                <Sparkles className="mt-0.5 h-5 w-5 text-amber-500" />
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              {examWorlds.map((world, index) => {
                const unlocked = getExamWorldUnlockState(examLevelProgress, index);
                const active = index === worldIndex;

                return (
                  <button
                    key={world.id}
                    type="button"
                    onClick={() => {
                      if (!unlocked) {
                        return;
                      }
                      setWorldIndex(index);
                      updateChallengeSession({ activeWorldId: world.id, selectedLevelId: null, activeLevelId: null });
                      persistNow();
                    }}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
                      active
                        ? "border-emerald-200 bg-emerald-500 text-white shadow-[0_12px_28px_rgba(16,185,129,0.28)]"
                        : unlocked
                          ? "border-white/80 bg-white/80 text-slate-700 hover:text-ink"
                          : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                    )}
                  >
                    {unlocked ? <Map className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    <span>{world.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Card className="space-y-4 border border-white/70 bg-white/72 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">Current World</p>
                <h2 className="mt-2 text-2xl font-black text-ink">{activeWorld.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{activeWorld.subtitle}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-right">
                <p className="text-xs text-emerald-700">当前模式</p>
                <p className="text-sm font-bold text-emerald-900">{activeModeLabel}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[1.35rem] bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Simple</p>
                <p className="mt-2 text-2xl font-black text-ink">{simpleOverview.totalStars}</p>
                <p className="text-xs text-slate-500">总星数</p>
              </div>
              <div className="rounded-[1.35rem] bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Hard</p>
                <p className="mt-2 text-2xl font-black text-ink">{hardOverview.totalStars}</p>
                <p className="text-xs text-slate-500">总星数</p>
              </div>
              <div className="rounded-[1.35rem] bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Mistakes</p>
                <p className="mt-2 text-2xl font-black text-ink">{examMistakes.length}</p>
                <p className="text-xs text-slate-500">闯关错题</p>
              </div>
              <div className="rounded-[1.35rem] bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Progress</p>
                <p className="mt-2 text-2xl font-black text-ink">{getExamOverview(examLevelProgress).clearedLevels}</p>
                <p className="text-xs text-slate-500">已通关关卡</p>
              </div>
            </div>
          </Card>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.45fr_0.55fr]">
        <Card className={cn("relative overflow-hidden border border-white/70 p-0 bg-gradient-to-br", activeWorld.surfaceClass)}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.85),transparent_26%),radial-gradient(circle_at_78%_18%,rgba(255,255,255,0.75),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02))]" />
          <div className="absolute left-[6%] top-[12%] h-24 w-44 rounded-full bg-white/40 blur-2xl" />
          <div className="absolute right-[8%] top-[24%] h-28 w-56 rounded-full bg-white/30 blur-2xl" />
          <div className="absolute bottom-[-2%] left-0 right-0 h-40 bg-[linear-gradient(180deg,rgba(34,197,94,0.02),rgba(21,128,61,0.12))]" />

          <div className="relative h-[520px] px-8 py-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">World Map</p>
                <h3 className="mt-2 text-3xl font-black text-ink">{activeWorld.name}</h3>
                <p className="mt-2 max-w-xl text-sm leading-7 text-slate-600">{activeWorld.description}</p>
              </div>
              <div className="rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600">
                横向地图 · 桌面优化
              </div>
            </div>

            <div className="absolute inset-x-10 bottom-12 top-28">
              {activeWorld.levels.slice(0, -1).map((level, index) => {
                const from = DESKTOP_NODE_POSITIONS[index];
                const to = DESKTOP_NODE_POSITIONS[index + 1];
                const dx = parseFloat(to.left) - parseFloat(from.left);
                const dy = parseFloat(to.top) - parseFloat(from.top);
                const length = Math.sqrt(dx * dx + dy * dy);
                const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
                const cleared = Boolean(examLevelProgress[level.id]?.cleared);

                return (
                  <div
                    key={`${level.id}-line`}
                    className={cn(
                      "absolute h-[6px] rounded-full",
                      cleared
                        ? "bg-[linear-gradient(90deg,#34d399,#facc15)] shadow-[0_8px_22px_rgba(16,185,129,0.18)]"
                        : "bg-[linear-gradient(90deg,rgba(226,232,240,0.95),rgba(255,255,255,0.95))]"
                    )}
                    style={{
                      left: from.left,
                      top: from.top,
                      width: `${length}%`,
                      transform: `rotate(${angle}deg)`,
                      transformOrigin: "left center"
                    }}
                  />
                );
              })}

              {activeWorld.levels.map((level, index) => {
                const unlocked = worldUnlocked && getLevelUnlockState(worldIndex, index, examLevelProgress);
                const cleared = Boolean(examLevelProgress[level.id]?.cleared);
                const selected = selectedLevel?.id === level.id;

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
                        activeLevelId: null,
                        selectedLevelId: level.id
                      });
                      persistNow();
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 text-left transition hover:scale-[1.02]"
                    style={{ left: DESKTOP_NODE_POSITIONS[index].left, top: DESKTOP_NODE_POSITIONS[index].top }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 3 }, (_, starIndex) => (
                          <Star
                            key={`${level.id}-star-${starIndex + 1}`}
                            className={cn(
                              "h-3.5 w-3.5",
                              starIndex < (examLevelProgress[level.id]?.bestStars ?? 0)
                                ? "fill-yellow-300 text-yellow-300"
                                : "fill-white/70 text-white/80"
                            )}
                          />
                        ))}
                      </div>
                      <div
                        className={cn(
                          "flex h-14 w-14 items-center justify-center rounded-full border-[3px] text-base font-black backdrop-blur-sm",
                          nodeTone({ unlocked, cleared, selected })
                        )}
                      >
                        {cleared ? <Check className="h-5 w-5" /> : unlocked ? level.label : <Lock className="h-4 w-4" />}
                      </div>
                      <span className="rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700">
                        第 {level.label} 关
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <Card className="space-y-5 border border-white/70 bg-white/78">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">Selected Stage</p>
            <h3 className="text-3xl font-black text-ink">第 {selectedLevel?.label ?? "--"} 关</h3>
            <p className="text-sm leading-7 text-slate-600">
              {selectedUnlocked
                ? `词条范围 ${selectedLevel?.rangeLabel ?? "--"}，点击开始进入本关。`
                : "当前关卡尚未解锁，请先完成前置关卡。"}
            </p>
          </div>

          <div className="space-y-3 rounded-[1.6rem] border border-emerald-100 bg-[linear-gradient(145deg,#f6fffa,#effcf4)] px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">推荐挑战</p>
                <p className="text-xs text-slate-500">{currentLevel ? `当前推荐第 ${currentLevel.label} 关` : "从已解锁关卡开始"}</p>
              </div>
            </div>

            <Button type="button" className="w-full justify-between" onClick={openLevel} disabled={!selectedUnlocked}>
              <span className="inline-flex items-center gap-2">
                <Swords className="h-4 w-4" />
                开始当前关卡
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[1.35rem] bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-700">最佳星级</span>
                <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-600">
                  <Trophy className="h-4 w-4" />
                  {selectedRecord?.bestStars ?? 0}
                </span>
              </div>
            </div>
            <div className="rounded-[1.35rem] bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-700">最佳正确率</span>
                <span className="text-sm font-bold text-slate-900">{selectedRecord?.bestAccuracy ?? 0}%</span>
              </div>
            </div>
            <div className="rounded-[1.35rem] bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-700">世界状态</span>
                <span className={cn("text-sm font-bold", worldUnlocked ? "text-emerald-700" : "text-slate-500")}>
                  {worldUnlocked ? "已解锁" : "待解锁"}
                </span>
              </div>
            </div>
            <div className="rounded-[1.35rem] bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-700">世界序号</span>
                <span className="text-sm font-bold text-slate-900">{worldIndex + 1} / {examWorlds.length}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[1.45rem] border border-dashed border-slate-200 px-4 py-4">
            <p className="text-sm font-semibold text-slate-800">桌面端优化</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              保留手机端原有简化地图与弹层流程，桌面端改为独立横向地图，信息层级更清晰，操作也更接近你之前那版。
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
