import type { ExamLevelRecord } from "@/types/content";
import { getExamOverview } from "@/lib/challenge-data";

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  progressLabel: string;
}

interface AchievementInput {
  knownWords: number;
  completedSentences: number;
  completedPassages: number;
  streakDays: number;
  reviewMistakes: number;
  examLevelProgress: Record<string, ExamLevelRecord>;
}

export function buildAchievements(input: AchievementInput): AchievementItem[] {
  const examOverview = getExamOverview(input.examLevelProgress);

  return [
    {
      id: "known-100",
      title: "百词起步",
      description: "掌握 100 个单词。",
      unlocked: input.knownWords >= 100,
      progressLabel: `${Math.min(input.knownWords, 100)} / 100`
    },
    {
      id: "known-1000",
      title: "千词进阶",
      description: "掌握 1000 个单词。",
      unlocked: input.knownWords >= 1000,
      progressLabel: `${Math.min(input.knownWords, 1000)} / 1000`
    },
    {
      id: "sentence-300",
      title: "句感成形",
      description: "完成 300 条句子训练。",
      unlocked: input.completedSentences >= 300,
      progressLabel: `${Math.min(input.completedSentences, 300)} / 300`
    },
    {
      id: "reading-30",
      title: "阅读破冰",
      description: "完成 30 篇短文阅读。",
      unlocked: input.completedPassages >= 30,
      progressLabel: `${Math.min(input.completedPassages, 30)} / 30`
    },
    {
      id: "world-2",
      title: "二界通行",
      description: "解锁第 2 个闯关世界。",
      unlocked: examOverview.unlockedWorlds >= 2,
      progressLabel: `${Math.min(examOverview.unlockedWorlds, 2)} / 2`
    },
    {
      id: "world-5",
      title: "五界穿行",
      description: "解锁第 5 个闯关世界。",
      unlocked: examOverview.unlockedWorlds >= 5,
      progressLabel: `${Math.min(examOverview.unlockedWorlds, 5)} / 5`
    },
    {
      id: "stars-30",
      title: "星图初成",
      description: "累计获得 30 颗闯关星级。",
      unlocked: examOverview.totalStars >= 30,
      progressLabel: `${Math.min(examOverview.totalStars, 30)} / 30`
    },
    {
      id: "streak-7",
      title: "七日连学",
      description: "连续学习 7 天。",
      unlocked: input.streakDays >= 7,
      progressLabel: `${Math.min(input.streakDays, 7)} / 7`
    },
    {
      id: "review-clean",
      title: "清屏复盘",
      description: "把当前复习错题池清到 0。",
      unlocked: input.reviewMistakes === 0 && (input.knownWords > 0 || input.completedSentences > 0),
      progressLabel: input.reviewMistakes === 0 ? "已清空" : `剩余 ${input.reviewMistakes} 题`
    }
  ];
}
