"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Flag,
  Lock,
  Sparkles,
  Star,
  Swords,
  Target,
  Trophy,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  examWorlds,
  examWorldsWarning,
  getExamWorldUnlockState
} from "@/lib/challenge-data";
import { appConfig } from "@/lib/app-config";
import { withBasePath } from "@/lib/base-path";
import { cn } from "@/lib/utils";
import { useLearningStore } from "@/stores/learning-store";
import {
  canAccessLevel,
  findLevelEntry,
  getCurrentPlayableWorldIndex,
  getCurrentPlayerLevel,
  getLevelUnlockState,
  getNextPlayableLevelEntry
} from "@/features/challenge/challenge-shared";
import {
  challengeCopy,
  getChallengeModeStats,
  getChallengePalette,
  getChallengeRewardHint,
  getChallengeWorldStats
} from "@/features/challenge/challenge-ui";

const DESKTOP_NODE_POSITIONS = [
  { left: "5%", top: "75%" },
  { left: "13%", top: "58%" },
  { left: "21%", top: "72%" },
  { left: "31%", top: "50%" },
  { left: "41%", top: "67%" },
  { left: "51%", top: "40%" },
  { left: "61%", top: "61%" },
  { left: "71%", top: "34%" },
  { left: "81%", top: "55%" },
  { left: "89%", top: "28%" },
  { left: "95%", top: "48%" },
  { left: "99%", top: "20%" }
] as const;

function getSeasonOverlay(season: "spring" | "summer" | "autumn" | "winter") {
  if (season === "spring") {
    return "bg-[radial-gradient(circle_at_16%_20%,rgba(255,229,239,0.85),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(219,245,220,0.76),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.55),rgba(255,255,255,0.08))]";
  }

  if (season === "summer") {
    return "bg-[radial-gradient(circle_at_18%_18%,rgba(210,241,255,0.88),transparent_30%),radial-gradient(circle_at_82%_22%,rgba(255,244,190,0.74),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.5),rgba(255,255,255,0.08))]";
  }

  if (season === "autumn") {
    return "bg-[radial-gradient(circle_at_18%_18%,rgba(255,229,193,0.82),transparent_30%),radial-gradient(circle_at_78%_18%,rgba(255,242,210,0.72),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.52),rgba(255,255,255,0.08))]";
  }

  return "bg-[radial-gradient(circle_at_16%_18%,rgba(232,241,255,0.84),transparent_30%),radial-gradient(circle_at_80%_18%,rgba(255,255,255,0.76),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.56),rgba(255,255,255,0.08))]";
}

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  paletteAccent,
  paletteSurface
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Trophy;
  paletteAccent: string;
  paletteSurface: string;
}) {
  return (
    <div
      className="rounded-[1.55rem] border border-white/78 bg-[linear-gradient(145deg,rgba(255,255,255,0.95),rgba(248,250,252,0.84))] px-4 py-4 shadow-[0_20px_40px_rgba(148,163,184,0.16)] backdrop-blur-sm"
      style={{ boxShadow: "0 22px 42px rgba(148, 163, 184, 0.16), inset 0 1px 0 rgba(255,255,255,0.72)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-2 text-[1.8rem] font-black tracking-tight text-slate-950">{value}</p>
        </div>
        <span
          className="inline-flex h-11 w-11 items-center justify-center rounded-[1.2rem]"
          style={{
            background: `linear-gradient(145deg, ${paletteSurface}, rgba(255,255,255,0.95))`,
            color: paletteAccent
          }}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{hint}</p>
    </div>
  );
}

function ProgressMeter({
  label,
  value,
  summary,
  paletteAccent,
  paletteSoft
}: {
  label: string;
  value: number;
  summary: string;
  paletteAccent: string;
  paletteSoft: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <p className="text-sm font-bold text-slate-900">{summary}</p>
      </div>
      <div className="h-3.5 rounded-full bg-white/82 shadow-[inset_0_1px_2px_rgba(148,163,184,0.22)]">
        <div
          className="challenge-path-flow h-full rounded-full"
          style={{
            width: `${Math.max(0, Math.min(value, 100))}%`,
            background: `linear-gradient(90deg, ${paletteAccent}, ${paletteSoft}, ${paletteAccent})`
          }}
        />
      </div>
    </div>
  );
}

function ModeLane({
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
        "rounded-[1.55rem] border px-4 py-4 transition backdrop-blur-sm",
        active ? "border-white/80 bg-white/88" : "border-white/65 bg-white/72"
      )}
      style={{
        boxShadow: active
          ? `0 18px 36px ${paletteGlow}, inset 0 1px 0 rgba(255,255,255,0.78)`
          : "0 10px 24px rgba(148,163,184,0.12)"
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-900">{label}</p>
          <p className="mt-1 text-xs text-slate-500">
            已完成 {stats.clearedLevels}/{stats.totalLevels} 关
          </p>
        </div>
        {active ? (
          <span
            className="rounded-full px-3 py-1 text-xs font-bold text-white"
            style={{ background: `linear-gradient(145deg, ${paletteAccent}, ${paletteAccent})` }}
          >
            当前
          </span>
        ) : null}
      </div>
      <div className="mt-3 h-2.5 rounded-full bg-slate-100">
        <div
          className="h-full rounded-full"
          style={{
            width: `${stats.completionPercent}%`,
            background: `linear-gradient(90deg, ${paletteAccent}, rgba(255,255,255,0.92))`
          }}
        />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>完成率 {stats.completionPercent}%</span>
        <span>总星数 {stats.totalStars}</span>
      </div>
    </div>
  );
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
  const mapSectionRef = useRef<HTMLDivElement | null>(null);

  const isChallengeUnavailable = Boolean(examWorldsWarning) || examWorlds.length === 0;
  const activeModeLabel = activeMode === "simple" ? "简单模式" : "困难模式";

  const sequentialWorldIndex = getCurrentPlayableWorldIndex(examLevelProgress);
  const [worldIndex, setWorldIndex] = useState(sequentialWorldIndex);

  useEffect(() => {
    if (!appConfig.challengeFreeSelectionEnabled) {
      if (worldIndex !== sequentialWorldIndex) {
        setWorldIndex(sequentialWorldIndex);
      }
      return;
    }

    if (!challengeSession.activeWorldId) {
      return;
    }

    const index = examWorlds.findIndex((world) => world.id === challengeSession.activeWorldId);
    if (index >= 0 && index !== worldIndex) {
      setWorldIndex(index);
    }
  }, [challengeSession.activeWorldId, sequentialWorldIndex, worldIndex]);

  if (!hydrated) {
    return <div className="py-10 text-sm text-slate-500">加载闯关地图中...</div>;
  }

  if (isChallengeUnavailable) {
    return (
      <Card className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-surge">Challenge</p>
        <h2 className="text-3xl font-black text-ink">当前无法生成闯关地图</h2>
        <p className="text-sm leading-7 text-slate-600">{examWorldsWarning ?? "闯关数据暂不可用。"}</p>
      </Card>
    );
  }

  const activeWorld = examWorlds[worldIndex];
  const WorldIcon = activeWorld.icon;
  const worldUnlocked = getExamWorldUnlockState(examLevelProgress, worldIndex);
  const currentLevel = getCurrentPlayerLevel(worldIndex, examLevelProgress, challengeSession.activeLevelId);
  const nextPlayableEntry = getNextPlayableLevelEntry(examLevelProgress);
  const selectedLevel =
    appConfig.challengeFreeSelectionEnabled
      ? (challengeSession.selectedLevelId &&
          findLevelEntry(challengeSession.selectedLevelId)?.world.id === activeWorld.id &&
          activeWorld.levels.find((level) => level.id === challengeSession.selectedLevelId)) ||
        currentLevel ||
        activeWorld.levels[0]
      : (nextPlayableEntry?.world.id === activeWorld.id ? nextPlayableEntry.level : null) ||
        currentLevel ||
        activeWorld.levels[0];
  const selectedLevelIndex = activeWorld.levels.findIndex((level) => level.id === selectedLevel?.id);
  const selectedUnlocked = selectedLevelIndex >= 0 && canAccessLevel(worldIndex, selectedLevelIndex, examLevelProgress);
  const selectedRecord = selectedLevel ? examLevelProgress[selectedLevel.id] : null;
  const selectedStars = selectedRecord?.bestStars ?? 0;
  const selectedPerfect = selectedStars === 3;
  const activePalette = getChallengePalette(activeWorld);
  const activeWorldStats = getChallengeWorldStats(examLevelProgress, worldIndex);
  const activeModeStats = getChallengeModeStats(examLevelProgress, worldIndex);
  const simpleModeStats = getChallengeModeStats(simpleProgress, worldIndex);
  const hardModeStats = getChallengeModeStats(hardProgress, worldIndex);
  const completedEntry = completedLevelId ? findLevelEntry(completedLevelId) : null;
  const unlockedEntry = unlockedLevelId ? findLevelEntry(unlockedLevelId) : null;
  const nextRewardHint = getChallengeRewardHint(worldIndex, selectedLevel?.label ?? null, selectedUnlocked);
  const selectedStatusLabel = !worldUnlocked
    ? "世界预览"
    : !selectedUnlocked
      ? "未解锁"
      : !selectedRecord?.cleared
        ? "当前可挑战"
        : selectedPerfect
          ? "三星通关"
          : "已通关";

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
    const levelPath = `/challenge/level/${selectedLevel.id}`;
    router.push(withBasePath(levelPath) ?? levelPath);
  };

  const scrollToMap = () => {
    mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="hidden gap-6 md:block" data-testid="desktop-challenge-map">
      <Card className="overflow-hidden border border-white/72 p-0 shadow-[0_28px_70px_rgba(148,163,184,0.16)]">
        <div className={cn("relative overflow-hidden bg-gradient-to-br", activeWorld.surfaceClass)}>
          <div className={cn("absolute inset-0 opacity-90", getSeasonOverlay(activeWorld.season))} />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.7),rgba(255,255,255,0.12))]" />
          <div
            className="challenge-float absolute left-[-6%] top-[-10%] h-56 w-56 rounded-full blur-3xl"
            style={{ background: activePalette.accentSurfaceStrong }}
          />
          <div className="challenge-float absolute bottom-[-16%] right-[-4%] h-60 w-60 rounded-full bg-white/40 blur-3xl" />
          <div className="absolute right-10 top-8 text-white/35">
            <WorldIcon className="h-40 w-40" strokeWidth={1.1} />
          </div>

          <div className="relative grid gap-6 px-7 py-7 lg:grid-cols-[1.35fr_0.65fr]">
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-[1.75rem] border border-white/70 bg-white/80 shadow-[0_18px_40px_rgba(148,163,184,0.16)]"
                      style={{ color: activePalette.accent }}
                    >
                      <WorldIcon className="h-7 w-7" strokeWidth={1.9} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.32em]" style={{ color: activePalette.accentText }}>
                        {challengeCopy.heroEyebrow}
                      </p>
                      <div className="flex items-center gap-3">
                        <h1 className="text-4xl font-black tracking-tight text-slate-950">{activeWorld.name}</h1>
                        <span
                          className="rounded-full px-3 py-1 text-xs font-bold"
                          style={{
                            color: activePalette.accentText,
                            background: `linear-gradient(145deg, ${activePalette.accentSurfaceStrong}, rgba(255,255,255,0.94))`,
                            border: `1px solid ${activePalette.accentBorder}`
                          }}
                        >
                          {worldIndex + 1}/{examWorlds.length}
                        </span>
                      </div>
                      <p className="text-base font-semibold text-slate-700">{activeWorld.subtitle}</p>
                    </div>
                  </div>

                  <div className="max-w-3xl space-y-3">
                    <p className="text-sm leading-7 text-slate-700">{activeWorld.description}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/76 px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-[0_10px_24px_rgba(148,163,184,0.12)]">
                        当前模式：{activeModeLabel}
                      </span>
                      <span className="rounded-full bg-white/76 px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-[0_10px_24px_rgba(148,163,184,0.12)]">
                        已解锁世界 {activeModeStats.unlockedWorlds}/{examWorlds.length}
                      </span>
                      <span className="rounded-full bg-white/76 px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-[0_10px_24px_rgba(148,163,184,0.12)]">
                        当前世界星数 {activeWorldStats.totalStars}/{activeWorldStats.totalLevels * 3}
                      </span>
                      {!worldUnlocked ? (
                        <span
                          className="rounded-full px-3 py-1.5 text-sm font-semibold"
                          style={{
                            color: activePalette.accentText,
                            background: `linear-gradient(145deg, ${activePalette.accentSurface}, rgba(255,255,255,0.9))`
                          }}
                        >
                          当前地图为预览状态
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={scrollToMap}
                  className="inline-flex items-center gap-3 rounded-full border border-white/75 bg-white/82 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-[0_16px_32px_rgba(148,163,184,0.16)] transition hover:-translate-y-0.5"
                >
                  <span
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white"
                    style={{ background: `linear-gradient(145deg, ${activePalette.accent}, ${activePalette.accentStrong})` }}
                  >
                    <ChevronDown className="h-5 w-5" />
                  </span>
                  查看世界地图
                </button>
              </div>

              {(completedEntry || unlockedEntry) ? (
                <div
                  className="flex items-start justify-between gap-4 rounded-[1.55rem] border px-5 py-4"
                  style={{
                    background: "linear-gradient(145deg,#fff8dc,#fff0b8)",
                    borderColor: "rgba(245, 158, 11, 0.22)",
                    boxShadow: "0 16px 32px rgba(245, 158, 11, 0.12)"
                  }}
                >
                  <div className="space-y-1">
                    {completedEntry ? (
                      <p className="text-sm font-semibold text-amber-800">
                        已完成 {completedEntry.world.name} 第 {completedEntry.level.label} 关
                      </p>
                    ) : null}
                    <p className="text-sm text-slate-700">
                      {unlockedEntry ? `新关卡已点亮：第 ${unlockedEntry.level.label} 关，继续冲刺吧。` : "地图进度已经更新。"}
                    </p>
                  </div>
                  <Sparkles className="mt-0.5 h-5 w-5 text-amber-500" />
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  label={challengeCopy.currentWorld}
                  value={`${activeWorldStats.clearedLevels}/${activeWorldStats.totalLevels}`}
                  hint="你已经点亮的关卡数"
                  icon={Flag}
                  paletteAccent={activePalette.accent}
                  paletteSurface={activePalette.accentSurface}
                />
                <MetricCard
                  label={challengeCopy.worldStars}
                  value={`${activeWorldStats.totalStars}`}
                  hint="当前世界累计获得的星数"
                  icon={Star}
                  paletteAccent={activePalette.accent}
                  paletteSurface={activePalette.accentSurface}
                />
                <MetricCard
                  label={challengeCopy.perfectClears}
                  value={`${activeWorldStats.perfectLevels}`}
                  hint="已经拿到三星的关卡"
                  icon={Trophy}
                  paletteAccent={activePalette.accent}
                  paletteSurface={activePalette.accentSurface}
                />
                <MetricCard
                  label={challengeCopy.mistakes}
                  value={`${examMistakes.length}`}
                  hint="可回头集中补强的闯关错题"
                  icon={Zap}
                  paletteAccent={activePalette.accent}
                  paletteSurface={activePalette.accentSurface}
                />
              </div>

              <div className="rounded-[1.8rem] border border-white/76 bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(248,250,252,0.78))] px-5 py-5 shadow-[0_22px_48px_rgba(148,163,184,0.16)] backdrop-blur-sm">
                <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
                  <div className="space-y-4">
                    <ProgressMeter
                      label="当前世界推进"
                      value={activeWorldStats.completionPercent}
                      summary={`${activeWorldStats.completionPercent}%`}
                      paletteAccent={activePalette.accent}
                      paletteSoft={activePalette.pathEnd}
                    />
                    <ProgressMeter
                      label="本世界星级收集"
                      value={activeWorldStats.starPercent}
                      summary={`${activeWorldStats.totalStars}/${activeWorldStats.totalLevels * 3}`}
                      paletteAccent={activePalette.accentStrong}
                      paletteSoft={activePalette.pathEnd}
                    />
                    <p className="text-sm leading-7 text-slate-600">
                      {selectedUnlocked
                        ? `你现在最接近的目标是第 ${selectedLevel?.label ?? "--"} 关。${nextRewardHint}`
                        : nextRewardHint}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Button
                      type="button"
                      onClick={openLevel}
                      disabled={!selectedUnlocked}
                      className="challenge-shine h-14 w-full justify-between rounded-[1.45rem] px-5 text-base font-bold text-white shadow-[0_20px_40px_rgba(15,23,42,0.16)]"
                      style={{
                        background: `linear-gradient(145deg, ${activePalette.accent}, ${activePalette.accentStrong})`,
                        boxShadow: `0 22px 42px ${activePalette.glow}`
                      }}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Swords className="h-4 w-4" />
                        {selectedUnlocked ? `继续挑战 第 ${selectedLevel?.label ?? "--"} 关` : "先完成前置关卡"}
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <ModeLane
                        label="简单模式"
                        stats={simpleModeStats}
                        active={activeMode === "simple"}
                        paletteAccent={activePalette.accent}
                        paletteGlow={activePalette.glow}
                      />
                      <ModeLane
                        label="困难模式"
                        stats={hardModeStats}
                        active={activeMode === "hard"}
                        paletteAccent={activePalette.accentStrong}
                        paletteGlow={activePalette.glow}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {examWorlds.map((world, index) => {
                  const unlocked = getExamWorldUnlockState(examLevelProgress, index);
                  const previewable = unlocked || appConfig.challengeFreeSelectionEnabled;
                  const active = index === worldIndex;
                  const chipPalette = getChallengePalette(world);
                  const ChipIcon = world.icon;

                  return (
                    <button
                      key={world.id}
                      type="button"
                      onClick={() => {
                        if (!previewable || (!appConfig.challengeFreeSelectionEnabled && index !== sequentialWorldIndex)) {
                          return;
                        }
                        setWorldIndex(index);
                        updateChallengeSession({ activeWorldId: world.id, selectedLevelId: null, activeLevelId: null });
                        persistNow();
                      }}
                      className={cn(
                        "group rounded-[1.4rem] border px-4 py-3 text-left transition duration-200 hover:-translate-y-0.5",
                        previewable ? "cursor-pointer" : "cursor-not-allowed opacity-70"
                      )}
                      style={{
                        minWidth: 172,
                        background: active
                          ? `linear-gradient(145deg, ${chipPalette.accent}, ${chipPalette.accentStrong})`
                          : `linear-gradient(145deg, ${chipPalette.accentSurface}, rgba(255,255,255,0.9))`,
                        borderColor: active ? "rgba(255,255,255,0.5)" : chipPalette.accentBorder,
                        color: active ? "#ffffff" : "#1f2937",
                        boxShadow: active ? `0 18px 38px ${chipPalette.glow}` : "0 14px 28px rgba(148,163,184,0.12)"
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span
                          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl"
                          style={{
                            background: active
                              ? "rgba(255,255,255,0.2)"
                              : `linear-gradient(145deg, rgba(255,255,255,0.94), ${chipPalette.accentSurfaceStrong})`
                          }}
                        >
                          {unlocked ? <ChipIcon className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        </span>
                        {!unlocked && previewable ? (
                          <span className="rounded-full bg-white/22 px-2.5 py-1 text-[11px] font-bold">预览</span>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm font-bold">{world.name}</p>
                      <p className={cn("mt-1 text-xs", active ? "text-white/78" : "text-slate-500")}>
                        {unlocked ? "已进入学习流程" : previewable ? "可提前查看地图" : "尚未解锁"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <Card className="space-y-4 border border-white/78 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(248,250,252,0.82))] shadow-[0_24px_52px_rgba(148,163,184,0.18)] backdrop-blur-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em]" style={{ color: activePalette.accentText }}>
                      {challengeCopy.nextGoalEyebrow}
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-slate-950">第 {selectedLevel?.label ?? "--"} 关</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {selectedUnlocked
                        ? `词条范围 ${selectedLevel?.rangeLabel ?? "--"}，现在就可以继续推进。`
                        : worldUnlocked
                          ? "这关还没有正式解锁，你可以先预览位置和成长目标。"
                          : "这个世界当前处于预览状态，等前一世界完成后会正式开放。"}
                    </p>
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-bold"
                    style={{
                      color: selectedUnlocked ? "#ffffff" : activePalette.accentText,
                      background: selectedUnlocked
                        ? `linear-gradient(145deg, ${activePalette.accent}, ${activePalette.accentStrong})`
                        : `linear-gradient(145deg, ${activePalette.accentSurface}, rgba(255,255,255,0.94))`,
                      border: `1px solid ${selectedUnlocked ? "rgba(255,255,255,0.24)" : activePalette.accentBorder}`
                    }}
                  >
                    {selectedStatusLabel}
                  </span>
                </div>

                <div
                  className="rounded-[1.55rem] border px-4 py-4"
                  style={{
                    background: `linear-gradient(145deg, ${activePalette.accentSurface}, rgba(255,255,255,0.96))`,
                    borderColor: activePalette.accentBorder
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-[1.15rem] text-white"
                      style={{ background: `linear-gradient(145deg, ${activePalette.accent}, ${activePalette.accentStrong})` }}
                    >
                      <Target className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-900">继续学习会获得什么</p>
                      <p className="text-sm text-slate-600">{nextRewardHint}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.3rem] bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{challengeCopy.bestStars}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      {Array.from({ length: 3 }, (_, index) => (
                        <Star
                          key={`selected-star-${index + 1}`}
                          className={cn(
                            "h-4 w-4",
                            index < selectedStars ? "fill-yellow-300 text-yellow-300" : "fill-slate-200 text-slate-200"
                          )}
                        />
                      ))}
                      <span className="ml-1 text-sm font-bold text-slate-900">{selectedStars}/3</span>
                    </div>
                  </div>

                  <div className="rounded-[1.3rem] bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{challengeCopy.accuracy}</p>
                    <p className="mt-2 text-lg font-black text-slate-900">{selectedRecord?.bestAccuracy ?? 0}%</p>
                  </div>

                  <div className="rounded-[1.3rem] bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{challengeCopy.worldState}</p>
                    <p className="mt-2 text-lg font-black" style={{ color: worldUnlocked ? activePalette.accentText : "#64748b" }}>
                      {worldUnlocked ? "已解锁" : "预览中"}
                    </p>
                  </div>

                  <div className="rounded-[1.3rem] bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{challengeCopy.nextTarget}</p>
                    <p className="mt-2 text-lg font-black text-slate-900">
                      {activeWorldStats.nextTargetLabel ? `第 ${activeWorldStats.nextTargetLabel} 关` : "世界完成"}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  className="h-12 w-full justify-between rounded-[1.35rem] px-5 text-base font-bold text-white"
                  onClick={openLevel}
                  disabled={!selectedUnlocked}
                  style={{
                    background: `linear-gradient(145deg, ${activePalette.accent}, ${activePalette.accentStrong})`,
                    boxShadow: `0 18px 36px ${activePalette.glow}`
                  }}
                >
                  <span className="inline-flex items-center gap-2">
                    <Swords className="h-4 w-4" />
                    {selectedUnlocked ? "进入当前关卡" : "先完成前置关卡"}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </Card>
      <div ref={mapSectionRef} className="grid gap-6 scroll-mt-28 lg:grid-cols-[1.45fr_0.55fr]">
        <Card className={cn("relative overflow-hidden border border-white/76 p-0 shadow-[0_24px_54px_rgba(148,163,184,0.16)] bg-gradient-to-br", activeWorld.surfaceClass)}>
          <div className={cn("absolute inset-0 opacity-95", getSeasonOverlay(activeWorld.season))} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_16%,rgba(255,255,255,0.96),transparent_24%),radial-gradient(circle_at_84%_14%,rgba(255,255,255,0.78),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04))]" />
          <div
            className="challenge-float absolute left-[8%] top-[18%] h-28 w-56 rounded-full blur-3xl"
            style={{ background: activePalette.accentSurfaceStrong }}
          />
          <div className="absolute bottom-[-6%] right-[10%] text-white/20">
            <WorldIcon className="h-56 w-56" strokeWidth={1} />
          </div>

          <div className="relative h-[700px] px-8 py-7">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex h-12 w-12 items-center justify-center rounded-[1.25rem] border border-white/70 bg-white/78"
                    style={{ color: activePalette.accent }}
                  >
                    <WorldIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{challengeCopy.mapEyebrow}</p>
                    <h3 className="mt-1 text-3xl font-black text-slate-950">{activeWorld.name}</h3>
                  </div>
                </div>
                <p className="max-w-xl text-sm leading-7 text-slate-600">{activeWorld.description}</p>
              </div>

              <div className="space-y-2 rounded-[1.4rem] border border-white/82 bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(248,250,252,0.78))] px-4 py-3 shadow-[0_16px_34px_rgba(148,163,184,0.16)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">当前进度</p>
                <p className="text-2xl font-black text-slate-950">{activeWorldStats.completionPercent}%</p>
                <p className="text-sm text-slate-500">
                  {worldUnlocked ? "继续沿着发光路径推进" : "先预览后续世界的地图氛围"}
                </p>
              </div>
            </div>

            <div className="absolute inset-x-8 bottom-10 top-32">
              {activeWorld.levels.slice(0, -1).map((level, index) => {
                const from = DESKTOP_NODE_POSITIONS[index];
                const to = DESKTOP_NODE_POSITIONS[index + 1];
                const dx = parseFloat(to.left) - parseFloat(from.left);
                const dy = parseFloat(to.top) - parseFloat(from.top);
                const length = Math.sqrt(dx * dx + dy * dy);
                const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
                const record = examLevelProgress[level.id];
                const cleared = Boolean(record?.cleared);
                const guidesToSelected = selectedUnlocked && selectedLevelIndex === index + 1;

                return (
                  <div
                    key={`${level.id}-line`}
                    className={cn(
                      "absolute h-[6px] rounded-full",
                      cleared || guidesToSelected ? "challenge-path-flow" : ""
                    )}
                    style={{
                      left: from.left,
                      top: from.top,
                      width: `${length * 1.03}%`,
                      transform: `rotate(${angle}deg)`,
                      transformOrigin: "left center",
                      opacity: cleared ? 1 : guidesToSelected ? 0.88 : 0.5,
                      background: cleared
                        ? `linear-gradient(90deg, ${activePalette.pathStart}, ${activePalette.pathEnd}, ${activePalette.pathStart})`
                        : guidesToSelected
                          ? `linear-gradient(90deg, ${activePalette.accentSurfaceStrong}, ${activePalette.pathEnd}, ${activePalette.accentSurface})`
                          : "linear-gradient(90deg, rgba(203,213,225,0.85), rgba(255,255,255,0.9))",
                      boxShadow: cleared ? `0 10px 24px ${activePalette.glow}` : "none"
                    }}
                  />
                );
              })}

              {activeWorld.levels.map((level, index) => {
                const record = examLevelProgress[level.id];
                const unlocked = worldUnlocked && getLevelUnlockState(worldIndex, index, examLevelProgress);
                const accessible = canAccessLevel(worldIndex, index, examLevelProgress);
                const cleared = Boolean(record?.cleared);
                const bestStars = record?.bestStars ?? 0;
                const perfect = cleared && bestStars === 3;
                const selected = selectedLevel?.id === level.id;
                const currentChallenge = accessible && !cleared;

                const labelText = !unlocked
                  ? "未解锁"
                  : currentChallenge
                    ? "当前"
                    : perfect
                      ? "三星"
                      : cleared
                        ? "完成"
                        : "已开启";

                return (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => {
                      if (!appConfig.challengeFreeSelectionEnabled && !accessible) {
                        return;
                      }
                      updateChallengeSession({
                        activeWorldId: activeWorld.id,
                        activeLevelId: null,
                        selectedLevelId: level.id
                      });
                      persistNow();
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 text-left"
                    style={{ left: DESKTOP_NODE_POSITIONS[index].left, top: DESKTOP_NODE_POSITIONS[index].top }}
                  >
                    <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.96 }} className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 3 }, (_, starIndex) => (
                          <Star
                            key={`${level.id}-star-${starIndex + 1}`}
                            className={cn(
                              "h-3.5 w-3.5 transition",
                              starIndex < bestStars
                                ? "fill-yellow-300 text-yellow-300 drop-shadow-[0_1px_3px_rgba(240,195,80,0.45)]"
                                : "fill-white/80 text-white/85"
                            )}
                          />
                        ))}
                      </div>

                      <div
                        className={cn(
                          "relative flex h-[4.15rem] w-[4.15rem] items-center justify-center rounded-full border-[3px] text-base font-black backdrop-blur-sm transition",
                          currentChallenge ? "challenge-node-current" : ""
                        )}
                        style={{
                          color: !unlocked
                            ? "#94a3b8"
                            : currentChallenge
                              ? "#ffffff"
                              : perfect
                                ? activePalette.accentText
                                : "#0f172a",
                          borderColor: currentChallenge
                            ? "rgba(255,255,255,0.78)"
                            : !unlocked
                              ? "rgba(203,213,225,0.92)"
                              : perfect
                                ? "rgba(250,204,21,0.6)"
                                : "rgba(255,255,255,0.82)",
                          background: !unlocked
                            ? "linear-gradient(145deg, rgba(226,232,240,0.94), rgba(255,255,255,0.82))"
                            : currentChallenge
                              ? `linear-gradient(145deg, ${activePalette.accent}, ${activePalette.accentStrong})`
                              : perfect
                                ? `linear-gradient(145deg, rgba(255,251,235,0.98), ${activePalette.accentSurfaceStrong})`
                                : cleared
                                  ? "linear-gradient(145deg, rgba(255,255,255,0.96), rgba(240,249,255,0.92))"
                                  : `linear-gradient(145deg, rgba(255,255,255,0.96), ${activePalette.accentSurface})`,
                          boxShadow: !unlocked
                            ? "0 12px 28px rgba(148,163,184,0.12)"
                            : currentChallenge
                              ? `0 0 0 6px rgba(255,255,255,0.62), 0 24px 44px ${activePalette.glow}`
                              : perfect
                                ? "0 18px 38px rgba(250,204,21,0.2)"
                                : `0 16px 34px ${activePalette.glow}`
                        }}
                      >
                        {selected && !currentChallenge ? (
                          <span
                            className="absolute inset-[-7px] rounded-full border"
                            style={{ borderColor: activePalette.accentBorder }}
                            aria-hidden="true"
                          />
                        ) : null}
                        {perfect ? (
                          <span className="absolute -top-1.5 -right-1.5 rounded-full bg-amber-300 px-1.5 py-0.5 text-[10px] font-black text-amber-950 shadow-[0_8px_18px_rgba(245,158,11,0.24)]">
                            3☆
                          </span>
                        ) : null}
                        {cleared ? <Check className="h-5 w-5" /> : unlocked ? level.label : <Lock className="h-4 w-4" />}
                      </div>

                      <div className="flex flex-col items-center gap-1">
                        <span
                          className="rounded-full px-3 py-1 text-xs font-bold"
                          style={{
                            background: unlocked ? "rgba(255,255,255,0.84)" : "rgba(255,255,255,0.62)",
                            color: unlocked ? "#334155" : "#94a3b8",
                            boxShadow: "0 10px 22px rgba(148,163,184,0.12)"
                          }}
                        >
                          第 {level.label} 关
                        </span>
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                          style={{
                            background: currentChallenge
                              ? "rgba(255,255,255,0.16)"
                              : unlocked
                                ? `linear-gradient(145deg, ${activePalette.accentSurface}, rgba(255,255,255,0.94))`
                                : "rgba(255,255,255,0.58)",
                            color: currentChallenge ? "#ffffff" : unlocked ? activePalette.accentText : "#94a3b8"
                          }}
                        >
                          {labelText}
                        </span>
                      </div>
                    </motion.div>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <Card className="space-y-5 border border-white/75 bg-white/84">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em]" style={{ color: activePalette.accentText }}>
              {challengeCopy.currentStageEyebrow}
            </p>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-3xl font-black text-slate-950">第 {selectedLevel?.label ?? "--"} 关</h3>
              <span
                className="rounded-full px-3 py-1 text-xs font-bold"
                style={{
                  color: selectedUnlocked ? "#ffffff" : activePalette.accentText,
                  background: selectedUnlocked
                    ? `linear-gradient(145deg, ${activePalette.accent}, ${activePalette.accentStrong})`
                    : `linear-gradient(145deg, ${activePalette.accentSurface}, rgba(255,255,255,0.94))`
                }}
              >
                {selectedStatusLabel}
              </span>
            </div>
            <p className="text-sm leading-7 text-slate-600">
              {selectedUnlocked
                ? `词条范围 ${selectedLevel?.rangeLabel ?? "--"}，点击下方按钮就能继续当前目标。`
                : worldUnlocked
                  ? "这关还没正式开放，你可以先看清路线和奖励反馈。"
                  : "这个世界还在预览阶段，先去完成前一世界的最后目标。"}
            </p>
          </div>

          <div
            className="rounded-[1.55rem] border px-4 py-4"
            style={{
              background: `linear-gradient(145deg, ${activePalette.accentSurface}, rgba(255,255,255,0.96))`,
              borderColor: activePalette.accentBorder
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-[1.15rem] text-white"
                style={{ background: `linear-gradient(145deg, ${activePalette.accent}, ${activePalette.accentStrong})` }}
              >
                <Target className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900">离下一个目标还有多远</p>
                <p className="text-sm text-slate-600">
                  {selectedUnlocked
                    ? `继续完成第 ${selectedLevel?.label ?? "--"} 关，推动当前世界继续点亮。`
                    : "你还需要先完成前面的解锁路径。"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-[1.3rem] bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-700">最佳星级</span>
                <span className="inline-flex items-center gap-1 text-sm font-bold text-amber-600">
                  <Trophy className="h-4 w-4" />
                  {selectedStars}
                </span>
              </div>
            </div>
            <div className="rounded-[1.3rem] bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-700">最佳正确率</span>
                <span className="text-sm font-bold text-slate-900">{selectedRecord?.bestAccuracy ?? 0}%</span>
              </div>
            </div>
            <div className="rounded-[1.3rem] bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-700">当前世界</span>
                <span className="text-sm font-bold text-slate-900">{worldIndex + 1} / {examWorlds.length}</span>
              </div>
            </div>
            <div className="rounded-[1.3rem] bg-slate-50 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-700">已点亮关卡</span>
                <span className="text-sm font-bold text-slate-900">
                  {activeWorldStats.clearedLevels}/{activeWorldStats.totalLevels}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-[1.45rem] border border-slate-200 bg-slate-50 px-4 py-4">
            <p className="text-sm font-bold text-slate-900">继续学下去会获得什么</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">{nextRewardHint}</p>
          </div>

          <Button
            type="button"
            className="h-12 w-full justify-between rounded-[1.35rem] px-5 text-base font-bold text-white"
            onClick={openLevel}
            disabled={!selectedUnlocked}
            style={{
              background: `linear-gradient(145deg, ${activePalette.accent}, ${activePalette.accentStrong})`,
              boxShadow: `0 18px 36px ${activePalette.glow}`
            }}
          >
            <span className="inline-flex items-center gap-2">
              <Swords className="h-4 w-4" />
              {selectedUnlocked ? "进入当前关卡" : "先完成前置关卡"}
            </span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>
      </div>
    </div>
  );
}
