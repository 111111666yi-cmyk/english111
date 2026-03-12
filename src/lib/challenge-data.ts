import { Compass, Landmark, Mountain, Orbit, Sailboat, Sprout, Stars, Sun, Trees } from "lucide-react";
import { words } from "@/lib/content";
import type { ExamLevelRecord, WordEntry } from "@/types/content";

export const EXAM_WORD_LIMIT = 3500;
export const EXAM_WORLD_COUNT = 9;
export const EXAM_LEVELS_PER_WORLD = 12;

export interface ExamLevel {
  id: string;
  label: string;
  rangeLabel: string;
  words: WordEntry[];
}

export interface ExamWorld {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  icon: typeof Sprout;
  surfaceClass: string;
  accentClass: string;
  levels: ExamLevel[];
}

const worldThemes = [
  {
    id: "world-1",
    name: "晨光词镇",
    subtitle: "先把最常见、最顺手的词走熟。",
    description: "轻松起步，先把基础阅读里的高频词记稳。",
    icon: Sprout,
    surfaceClass: "from-amber-100 via-white to-orange-100",
    accentClass: "bg-amber-500"
  },
  {
    id: "world-2",
    name: "晴窗词林",
    subtitle: "开始从单词走向更完整的句感。",
    description: "在更宽一点的词网里，开始建立辨义速度。",
    icon: Trees,
    surfaceClass: "from-emerald-100 via-white to-lime-100",
    accentClass: "bg-emerald-500"
  },
  {
    id: "world-3",
    name: "微风词湾",
    subtitle: "词义更细，干扰项也更近。",
    description: "这一段会出现更多相近词，开始训练排除能力。",
    icon: Sailboat,
    surfaceClass: "from-cyan-100 via-white to-sky-100",
    accentClass: "bg-sky-500"
  },
  {
    id: "world-4",
    name: "星轨词坡",
    subtitle: "从熟词迈向更正式的阅读表达。",
    description: "遇到正式表达和进阶义项时，保持节奏别慌。",
    icon: Stars,
    surfaceClass: "from-indigo-100 via-white to-blue-100",
    accentClass: "bg-indigo-500"
  },
  {
    id: "world-5",
    name: "长桥词港",
    subtitle: "开始进入更长的词汇链路。",
    description: "这里的单词跨度更长，适合把记忆和判断绑在一起。",
    icon: Landmark,
    surfaceClass: "from-violet-100 via-white to-fuchsia-100",
    accentClass: "bg-violet-500"
  },
  {
    id: "world-6",
    name: "远航词城",
    subtitle: "高频已过，开始啃更难的块。",
    description: "你会看到更少见但很有价值的阅读词。",
    icon: Compass,
    surfaceClass: "from-rose-100 via-white to-pink-100",
    accentClass: "bg-rose-500"
  },
  {
    id: "world-7",
    name: "雾山词境",
    subtitle: "难度抬升，错题开始更有代表性。",
    description: "这里适合专门看你最容易混掉的词义差异。",
    icon: Mountain,
    surfaceClass: "from-slate-100 via-white to-blue-50",
    accentClass: "bg-slate-600"
  },
  {
    id: "world-8",
    name: "曙塔词域",
    subtitle: "进入冲刺段，稳定性比速度更重要。",
    description: "继续稳住正确率，别让最后阶段变成纯碰运气。",
    icon: Sun,
    surfaceClass: "from-yellow-100 via-white to-cyan-50",
    accentClass: "bg-yellow-500"
  },
  {
    id: "world-9",
    name: "极光词穹",
    subtitle: "最后一段，把词汇地图完整走通。",
    description: "通关这里以后，前 3500 个核心词就真正连成了系统。",
    icon: Orbit,
    surfaceClass: "from-sky-100 via-white to-indigo-100",
    accentClass: "bg-surge"
  }
] as const;

function distributeItems(total: number, buckets: number) {
  const base = Math.floor(total / buckets);
  const remainder = total % buckets;

  return Array.from({ length: buckets }, (_, index) => base + (index < remainder ? 1 : 0));
}

function buildExamWorlds() {
  const availableWordCount = Math.min(words.length, EXAM_WORD_LIMIT);

  if (availableWordCount < EXAM_WORLD_COUNT * EXAM_LEVELS_PER_WORLD) {
    console.warn(
      `[challenge-data] Not enough words to build challenge worlds. Received ${availableWordCount}, expected at least ${EXAM_WORLD_COUNT * EXAM_LEVELS_PER_WORLD}.`
    );
    return {
      worlds: [] as ExamWorld[],
      warning: "当前题库不足，暂无法生成闯关地图。"
    };
  }

  const examWords = words.slice(0, availableWordCount);
  const levelSizes = distributeItems(availableWordCount, EXAM_WORLD_COUNT * EXAM_LEVELS_PER_WORLD);
  let cursor = 0;

  const worlds = worldThemes.map((theme, worldIndex) => ({
    ...theme,
    levels: Array.from({ length: EXAM_LEVELS_PER_WORLD }, (_, levelIndex) => {
      const size = levelSizes[worldIndex * EXAM_LEVELS_PER_WORLD + levelIndex];
      const start = cursor;
      const end = cursor + size;
      cursor = end;

      return {
        id: `${theme.id}-level-${levelIndex + 1}`,
        label: `${levelIndex + 1}`,
        rangeLabel: `${start + 1}-${end}`,
        words: examWords.slice(start, end)
      };
    })
  }));

  return {
    worlds,
    warning: null as string | null
  };
}

const examData = buildExamWorlds();

export const examWorlds: ExamWorld[] = examData.worlds;
export const examWorldsWarning = examData.warning;

export function getExamWorldUnlockState(progress: Record<string, ExamLevelRecord>, worldIndex: number) {
  if (worldIndex === 0) {
    return true;
  }

  const previousWorld = examWorlds[worldIndex - 1];
  if (!previousWorld) {
    return false;
  }

  return previousWorld.levels.every((level) => progress[level.id]?.cleared);
}

export function getExamStars(accuracy: number) {
  if (accuracy >= 90) {
    return 3;
  }

  if (accuracy >= 75) {
    return 2;
  }

  if (accuracy >= 60) {
    return 1;
  }

  return 0;
}

export function getExamOverview(progress: Record<string, ExamLevelRecord>) {
  const records = Object.values(progress);
  const clearedLevels = records.filter((record) => record.cleared).length;
  const totalStars = records.reduce((total, record) => total + record.bestStars, 0);
  const clearedWorlds = examWorlds.filter((world) =>
    world.levels.every((level) => progress[level.id]?.cleared)
  ).length;

  return {
    clearedLevels,
    totalStars,
    clearedWorlds,
    unlockedWorlds: examWorlds.filter((_, index) => getExamWorldUnlockState(progress, index)).length
  };
}
