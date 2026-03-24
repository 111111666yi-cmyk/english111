import { getExamOverview } from "@/lib/challenge-data";
import { releaseWordCount } from "@/lib/content";
import type { ExamLevelRecord } from "@/types/content";

export type AchievementCategory =
  | "vocabulary"
  | "sentences"
  | "reading"
  | "streak"
  | "challenge"
  | "review";

export interface AchievementItem {
  id: string;
  category: AchievementCategory;
  title: string;
  description: string;
  reward: number;
  unlocked: boolean;
  claimed: boolean;
  progressLabel: string;
  progressValue: number;
  progressTarget: number;
}

interface AchievementInput {
  knownWords: number;
  completedSentences: number;
  completedPassages: number;
  streakDays: number;
  reviewMistakes: number;
  examLevelProgress: Record<string, ExamLevelRecord>;
  claimedAchievementRewardIds?: string[];
}

interface AchievementProgress {
  unlocked: boolean;
  progressLabel: string;
  progressValue: number;
  progressTarget: number;
}

interface AchievementDefinition {
  id: string;
  category: AchievementCategory;
  title: string;
  description: string;
  getProgress: (input: AchievementInput, overview: ReturnType<typeof getExamOverview>) => AchievementProgress;
}

export const ACHIEVEMENT_CATEGORY_META: Record<
  AchievementCategory,
  { title: string; description: string }
> = {
  vocabulary: {
    title: "词汇成长",
    description: "从起步到高频词库，逐层记录你的掌握密度。"
  },
  sentences: {
    title: "句子训练",
    description: "把句感、句型和表达熟练度拉成一条清晰的进阶线。"
  },
  reading: {
    title: "短文阅读",
    description: "每读完一批短文，阅读耐力都会更稳一点。"
  },
  streak: {
    title: "连续学习",
    description: "用连续在场感，把学习节奏一点点养起来。"
  },
  challenge: {
    title: "闯关征途",
    description: "记录世界解锁、通关层级和星级积累。"
  },
  review: {
    title: "复习节奏",
    description: "把复习池压住，才能让长期记忆慢慢站稳。"
  }
};

function clampProgress(value: number, target: number) {
  return Math.max(0, Math.min(value, target));
}

function buildThresholdProgress(value: number, target: number): AchievementProgress {
  return {
    unlocked: value >= target,
    progressLabel: `${clampProgress(value, target)} / ${target}`,
    progressValue: clampProgress(value, target),
    progressTarget: target
  };
}

function createThresholdDefinition(
  id: string,
  category: AchievementCategory,
  title: string,
  description: string,
  readValue: (input: AchievementInput, overview: ReturnType<typeof getExamOverview>) => number,
  target: number
): AchievementDefinition {
  return {
    id,
    category,
    title,
    description,
    getProgress: (input, overview) => buildThresholdProgress(readValue(input, overview), target)
  };
}

function roundTarget(value: number) {
  return Math.max(1, Math.round(value / 10) * 10);
}

function buildVocabularyTargets(maxWords: number) {
  const safeMaxWords = Math.max(maxWords, 500);
  const baseTargets = [20, 50, 100, 200];
  const scaledTargets = [0.24, 0.36, 0.48, 0.62, 0.78, 1].map((ratio) => roundTarget(safeMaxWords * ratio));
  const targets = [...baseTargets, ...scaledTargets];

  for (let index = 1; index < targets.length; index += 1) {
    if (targets[index] <= targets[index - 1]) {
      targets[index] = targets[index - 1] + 10;
    }
  }

  targets[targets.length - 1] = safeMaxWords;
  return targets;
}

const rewardCycle = [5, 6, 7, 8, 9, 10] as const;
const vocabularyTargets = buildVocabularyTargets(releaseWordCount);

const achievementDefinitions: AchievementDefinition[] = [
  ...[
    ["known-20", "识词起步", vocabularyTargets[0]],
    ["known-50", "词感预热", vocabularyTargets[1]],
    ["known-100", "百词起步", vocabularyTargets[2]],
    ["known-200", "双百推进", vocabularyTargets[3]],
    ["known-350", "词库成片", vocabularyTargets[4]],
    ["known-500", "词汇进阶", vocabularyTargets[5]],
    ["known-800", "词汇扩张", vocabularyTargets[6]],
    ["known-1200", "千词站稳", vocabularyTargets[7]],
    ["known-1800", "词网成型", vocabularyTargets[8]],
    ["known-2500", "高频掌舵", vocabularyTargets[9]]
  ].map(([id, title, target]) =>
    createThresholdDefinition(
      String(id),
      "vocabulary",
      String(title),
      `掌握 ${target} 个发布级单词。`,
      (input) => input.knownWords,
      Number(target)
    )
  ),
  ...[
    ["sentence-20", "句感点亮", "完成 20 条句子训练。", 20],
    ["sentence-50", "句型起势", "完成 50 条句子训练。", 50],
    ["sentence-100", "句感提速", "完成 100 条句子训练。", 100],
    ["sentence-150", "表达连线", "完成 150 条句子训练。", 150],
    ["sentence-300", "句群成形", "完成 300 条句子训练。", 300],
    ["sentence-500", "表达进阶", "完成 500 条句子训练。", 500],
    ["sentence-800", "长句稳住", "完成 800 条句子训练。", 800],
    ["sentence-1200", "句法熟练", "完成 1200 条句子训练。", 1200]
  ].map(([id, title, description, target]) =>
    createThresholdDefinition(
      String(id),
      "sentences",
      String(title),
      String(description),
      (input) => input.completedSentences,
      Number(target)
    )
  ),
  ...[
    ["reading-3", "阅读开篇", "完成 3 篇短文阅读。", 3],
    ["reading-5", "五篇热身", "完成 5 篇短文阅读。", 5],
    ["reading-10", "阅读连贯", "完成 10 篇短文阅读。", 10],
    ["reading-15", "十五篇推进", "完成 15 篇短文阅读。", 15],
    ["reading-20", "二十篇稳读", "完成 20 篇短文阅读。", 20],
    ["reading-30", "阅读破冰", "完成 30 篇短文阅读。", 30],
    ["reading-45", "阅读持久", "完成 45 篇短文阅读。", 45],
    ["reading-60", "阅读远航", "完成 60 篇短文阅读。", 60]
  ].map(([id, title, description, target]) =>
    createThresholdDefinition(
      String(id),
      "reading",
      String(title),
      String(description),
      (input) => input.completedPassages,
      Number(target)
    )
  ),
  ...[
    ["streak-3", "三日开机", "连续学习 3 天。", 3],
    ["streak-7", "七日连学", "连续学习 7 天。", 7],
    ["streak-14", "两周打卡", "连续学习 14 天。", 14],
    ["streak-21", "三周稳住", "连续学习 21 天。", 21],
    ["streak-30", "月度在场", "连续学习 30 天。", 30],
    ["streak-45", "四十五天", "连续学习 45 天。", 45],
    ["streak-60", "六十天连线", "连续学习 60 天。", 60],
    ["streak-100", "百日恒进", "连续学习 100 天。", 100]
  ].map(([id, title, description, target]) =>
    createThresholdDefinition(
      String(id),
      "streak",
      String(title),
      String(description),
      (input) => input.streakDays,
      Number(target)
    )
  ),
  ...[
    ["world-2", "二界通行", "解锁第 2 个闯关世界。", 2],
    ["world-3", "三界远行", "解锁第 3 个闯关世界。", 3],
    ["world-4", "四界破浪", "解锁第 4 个闯关世界。", 4],
    ["world-5", "五界穿行", "解锁第 5 个闯关世界。", 5],
    ["world-7", "七界冲线", "解锁第 7 个闯关世界。", 7]
  ].map(([id, title, description, target]) =>
    createThresholdDefinition(
      String(id),
      "challenge",
      String(title),
      String(description),
      (_, overview) => overview.unlockedWorlds,
      Number(target)
    )
  ),
  ...[
    ["levels-5", "五关试锋", "累计通关 5 个关卡。", 5],
    ["levels-12", "首界通关", "累计通关 12 个关卡。", 12],
    ["levels-24", "双界贯通", "累计通关 24 个关卡。", 24],
    ["levels-48", "四十八关", "累计通关 48 个关卡。", 48]
  ].map(([id, title, description, target]) =>
    createThresholdDefinition(
      String(id),
      "challenge",
      String(title),
      String(description),
      (_, overview) => overview.clearedLevels,
      Number(target)
    )
  ),
  ...[
    ["stars-10", "星芒初亮", "累计获得 10 颗闯关星级。", 10],
    ["stars-30", "星图初成", "累计获得 30 颗闯关星级。", 30],
    ["stars-60", "星图扩张", "累计获得 60 颗闯关星级。", 60],
    ["stars-100", "百星沉淀", "累计获得 100 颗闯关星级。", 100],
    ["stars-180", "群星收束", "累计获得 180 颗闯关星级。", 180]
  ].map(([id, title, description, target]) =>
    createThresholdDefinition(
      String(id),
      "challenge",
      String(title),
      String(description),
      (_, overview) => overview.totalStars,
      Number(target)
    )
  ),
  {
    id: "review-clean",
    category: "review",
    title: "复习池清零",
    description: "完成任意学习后，把当前复习池整理到 0。",
    getProgress: (input) => {
      const studiedTotal = input.knownWords + input.completedSentences + input.completedPassages;
      const unlocked = studiedTotal > 0 && input.reviewMistakes === 0;

      return {
        unlocked,
        progressLabel:
          studiedTotal === 0
            ? "先完成任意学习内容"
            : unlocked
              ? "已完成"
              : `剩余 ${input.reviewMistakes} 项`,
        progressValue: unlocked ? 1 : 0,
        progressTarget: 1
      };
    }
  },
  {
    id: "review-steady",
    category: "review",
    title: "复习控场",
    description: "累计完成 120 个学习单元，且复习池不超过 5 项。",
    getProgress: (input) => {
      const studiedTotal = input.knownWords + input.completedSentences + input.completedPassages;
      const unlocked = studiedTotal >= 120 && input.reviewMistakes <= 5;

      if (studiedTotal < 120) {
        return {
          unlocked: false,
          progressLabel: `${clampProgress(studiedTotal, 120)} / 120`,
          progressValue: clampProgress(studiedTotal, 120),
          progressTarget: 120
        };
      }

      return {
        unlocked,
        progressLabel: unlocked ? "已完成" : `复习池 ${input.reviewMistakes} / 5`,
        progressValue: unlocked ? 5 : Math.max(0, 5 - Math.min(input.reviewMistakes, 5)),
        progressTarget: 5
      };
    }
  }
];

export const ACHIEVEMENT_TOTAL = achievementDefinitions.length;

export function buildAchievements(input: AchievementInput): AchievementItem[] {
  const overview = getExamOverview(input.examLevelProgress);
  const claimedIds = new Set(input.claimedAchievementRewardIds ?? []);

  return achievementDefinitions.map((definition, index) => {
    const progress = definition.getProgress(input, overview);

    return {
      id: definition.id,
      category: definition.category,
      title: definition.title,
      description: definition.description,
      reward: rewardCycle[index % rewardCycle.length],
      unlocked: progress.unlocked,
      claimed: claimedIds.has(definition.id),
      progressLabel: progress.progressLabel,
      progressValue: progress.progressValue,
      progressTarget: progress.progressTarget
    };
  });
}
