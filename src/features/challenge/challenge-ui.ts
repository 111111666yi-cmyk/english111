import { getLevelUnlockState } from "@/features/challenge/challenge-shared";
import {
  examWorlds,
  getExamOverview,
  getExamWorldUnlockState,
  type ExamWorld
} from "@/lib/challenge-data";
import type { ExamLevelRecord, QuizItem } from "@/types/content";

export interface ChallengePalette {
  accent: string;
  accentStrong: string;
  accentSurface: string;
  accentSurfaceStrong: string;
  accentBorder: string;
  accentText: string;
  accentMuted: string;
  glow: string;
  pathStart: string;
  pathEnd: string;
}

export interface ChallengeWorldStats {
  totalLevels: number;
  clearedLevels: number;
  accessibleLevels: number;
  totalStars: number;
  perfectLevels: number;
  completionPercent: number;
  starPercent: number;
  unlocked: boolean;
  remainingLevels: number;
  nextTargetLabel: string | null;
}

export interface ChallengeModeStats {
  clearedLevels: number;
  totalStars: number;
  clearedWorlds: number;
  unlockedWorlds: number;
  totalLevels: number;
  totalPossibleStars: number;
  completionPercent: number;
  starPercent: number;
  currentWorld: ChallengeWorldStats;
}

export const challengeCopy = {
  heroEyebrow: "单词远征",
  mapEyebrow: "世界地图",
  currentStageEyebrow: "当前关卡",
  nextGoalEyebrow: "下一目标",
  currentWorld: "当前世界",
  worldStars: "本世界星数",
  perfectClears: "三星通关",
  mistakes: "闯关错题",
  bestStars: "最佳星级",
  accuracy: "最佳正确率",
  worldState: "世界状态",
  nextTarget: "下一个目标"
} as const;

const challengeQuizTypeLabels: Record<QuizItem["type"], string> = {
  "single-choice": "单项选择",
  "fill-blank": "补全单词",
  match: "词义配对",
  reorder: "词序重组",
  "reading-question": "阅读理解",
  error: "题目异常"
};

const defaultPalette: ChallengePalette = {
  accent: "#6170f7",
  accentStrong: "#4b56d1",
  accentSurface: "rgba(97, 112, 247, 0.14)",
  accentSurfaceStrong: "rgba(97, 112, 247, 0.24)",
  accentBorder: "rgba(97, 112, 247, 0.26)",
  accentText: "#3f4ac6",
  accentMuted: "#6b75cf",
  glow: "rgba(97, 112, 247, 0.24)",
  pathStart: "#6170f7",
  pathEnd: "#93c5fd"
};

const palettesByAccentClass: Record<string, ChallengePalette> = {
  "bg-amber-500": {
    accent: "#f59e0b",
    accentStrong: "#d97706",
    accentSurface: "rgba(245, 158, 11, 0.14)",
    accentSurfaceStrong: "rgba(245, 158, 11, 0.22)",
    accentBorder: "rgba(245, 158, 11, 0.28)",
    accentText: "#9a5a00",
    accentMuted: "#b97718",
    glow: "rgba(245, 158, 11, 0.28)",
    pathStart: "#f59e0b",
    pathEnd: "#fde68a"
  },
  "bg-emerald-500": {
    accent: "#10b981",
    accentStrong: "#059669",
    accentSurface: "rgba(16, 185, 129, 0.14)",
    accentSurfaceStrong: "rgba(16, 185, 129, 0.22)",
    accentBorder: "rgba(16, 185, 129, 0.24)",
    accentText: "#0f766e",
    accentMuted: "#1f8c76",
    glow: "rgba(16, 185, 129, 0.24)",
    pathStart: "#10b981",
    pathEnd: "#6ee7b7"
  },
  "bg-sky-500": {
    accent: "#0ea5e9",
    accentStrong: "#0284c7",
    accentSurface: "rgba(14, 165, 233, 0.14)",
    accentSurfaceStrong: "rgba(14, 165, 233, 0.22)",
    accentBorder: "rgba(14, 165, 233, 0.24)",
    accentText: "#0369a1",
    accentMuted: "#3b82c4",
    glow: "rgba(14, 165, 233, 0.22)",
    pathStart: "#0ea5e9",
    pathEnd: "#7dd3fc"
  },
  "bg-indigo-500": {
    accent: "#6366f1",
    accentStrong: "#4f46e5",
    accentSurface: "rgba(99, 102, 241, 0.14)",
    accentSurfaceStrong: "rgba(99, 102, 241, 0.22)",
    accentBorder: "rgba(99, 102, 241, 0.24)",
    accentText: "#4338ca",
    accentMuted: "#6366c5",
    glow: "rgba(99, 102, 241, 0.24)",
    pathStart: "#6366f1",
    pathEnd: "#a5b4fc"
  },
  "bg-violet-500": {
    accent: "#8b5cf6",
    accentStrong: "#7c3aed",
    accentSurface: "rgba(139, 92, 246, 0.14)",
    accentSurfaceStrong: "rgba(139, 92, 246, 0.22)",
    accentBorder: "rgba(139, 92, 246, 0.24)",
    accentText: "#6d28d9",
    accentMuted: "#7c4be0",
    glow: "rgba(139, 92, 246, 0.24)",
    pathStart: "#8b5cf6",
    pathEnd: "#c4b5fd"
  },
  "bg-rose-500": {
    accent: "#f43f5e",
    accentStrong: "#e11d48",
    accentSurface: "rgba(244, 63, 94, 0.14)",
    accentSurfaceStrong: "rgba(244, 63, 94, 0.22)",
    accentBorder: "rgba(244, 63, 94, 0.24)",
    accentText: "#be123c",
    accentMuted: "#d65071",
    glow: "rgba(244, 63, 94, 0.22)",
    pathStart: "#f43f5e",
    pathEnd: "#fda4af"
  },
  "bg-slate-600": {
    accent: "#475569",
    accentStrong: "#334155",
    accentSurface: "rgba(71, 85, 105, 0.14)",
    accentSurfaceStrong: "rgba(71, 85, 105, 0.22)",
    accentBorder: "rgba(71, 85, 105, 0.24)",
    accentText: "#334155",
    accentMuted: "#64748b",
    glow: "rgba(71, 85, 105, 0.18)",
    pathStart: "#64748b",
    pathEnd: "#cbd5e1"
  },
  "bg-yellow-500": {
    accent: "#eab308",
    accentStrong: "#ca8a04",
    accentSurface: "rgba(234, 179, 8, 0.14)",
    accentSurfaceStrong: "rgba(234, 179, 8, 0.22)",
    accentBorder: "rgba(234, 179, 8, 0.24)",
    accentText: "#a16207",
    accentMuted: "#b98513",
    glow: "rgba(234, 179, 8, 0.22)",
    pathStart: "#eab308",
    pathEnd: "#fde68a"
  },
  "bg-surge": {
    accent: "#6170f7",
    accentStrong: "#4b56d1",
    accentSurface: "rgba(97, 112, 247, 0.14)",
    accentSurfaceStrong: "rgba(97, 112, 247, 0.24)",
    accentBorder: "rgba(97, 112, 247, 0.28)",
    accentText: "#3f4ac6",
    accentMuted: "#6b75cf",
    glow: "rgba(97, 112, 247, 0.24)",
    pathStart: "#6170f7",
    pathEnd: "#9fd0ff"
  }
};

export function getChallengePalette(worldOrAccentClass: Pick<ExamWorld, "accentClass"> | string): ChallengePalette {
  const accentClass = typeof worldOrAccentClass === "string" ? worldOrAccentClass : worldOrAccentClass.accentClass;
  return palettesByAccentClass[accentClass] ?? defaultPalette;
}

export function getChallengeWorldStats(
  progress: Record<string, ExamLevelRecord>,
  worldIndex: number
): ChallengeWorldStats {
  const world = examWorlds[worldIndex];

  if (!world) {
    return {
      totalLevels: 0,
      clearedLevels: 0,
      accessibleLevels: 0,
      totalStars: 0,
      perfectLevels: 0,
      completionPercent: 0,
      starPercent: 0,
      unlocked: false,
      remainingLevels: 0,
      nextTargetLabel: null
    };
  }

  let clearedLevels = 0;
  let accessibleLevels = 0;
  let totalStars = 0;
  let perfectLevels = 0;

  world.levels.forEach((level, levelIndex) => {
    const record = progress[level.id];
    const unlocked = getLevelUnlockState(worldIndex, levelIndex, progress);

    if (unlocked) {
      accessibleLevels += 1;
    }

    if (record?.cleared) {
      clearedLevels += 1;
    }

    totalStars += record?.bestStars ?? 0;

    if ((record?.bestStars ?? 0) === 3) {
      perfectLevels += 1;
    }
  });

  const totalLevels = world.levels.length;
  const completionPercent = totalLevels ? Math.round((clearedLevels / totalLevels) * 100) : 0;
  const starPercent = totalLevels ? Math.round((totalStars / (totalLevels * 3)) * 100) : 0;
  const nextTarget =
    world.levels.find((level, levelIndex) => getLevelUnlockState(worldIndex, levelIndex, progress) && !progress[level.id]?.cleared) ??
    null;

  return {
    totalLevels,
    clearedLevels,
    accessibleLevels,
    totalStars,
    perfectLevels,
    completionPercent,
    starPercent,
    unlocked: getExamWorldUnlockState(progress, worldIndex),
    remainingLevels: Math.max(totalLevels - clearedLevels, 0),
    nextTargetLabel: nextTarget?.label ?? null
  };
}

export function getChallengeModeStats(
  progress: Record<string, ExamLevelRecord>,
  currentWorldIndex: number
): ChallengeModeStats {
  const overview = getExamOverview(progress);
  const totalLevels = examWorlds.reduce((sum, world) => sum + world.levels.length, 0);
  const totalPossibleStars = totalLevels * 3;

  return {
    ...overview,
    totalLevels,
    totalPossibleStars,
    completionPercent: totalLevels ? Math.round((overview.clearedLevels / totalLevels) * 100) : 0,
    starPercent: totalPossibleStars ? Math.round((overview.totalStars / totalPossibleStars) * 100) : 0,
    currentWorld: getChallengeWorldStats(progress, currentWorldIndex)
  };
}

export function getChallengeRewardHint(
  worldIndex: number,
  currentLevelLabel: string | null,
  unlocked: boolean
) {
  if (!unlocked) {
    return "完成前一世界后，这片地图就会正式点亮。";
  }

  const nextWorld = examWorlds[worldIndex + 1];
  const nextLevel = currentLevelLabel ? Number(currentLevelLabel) + 1 : null;

  if (nextLevel && nextLevel <= (examWorlds[worldIndex]?.levels.length ?? 0)) {
    return `完成本关后，你将推进到第 ${nextLevel} 关。`;
  }

  if (nextWorld) {
    return `完成本世界后，将解锁 ${nextWorld.name}。`;
  }

  return "完成这里后，你会点亮整张单词闯关地图。";
}

export function getChallengeQuizTypeLabel(
  type: QuizItem["type"],
  mode?: NonNullable<QuizItem["meta"]>["mode"]
) {
  if (type === "reading-question" && mode === "true-false") {
    return "判断题";
  }

  if (type === "reading-question" && mode === "meaning") {
    return "词义判断";
  }

  if (type === "reading-question" && mode === "spelling") {
    return "拼写判断";
  }

  return challengeQuizTypeLabels[type];
}
