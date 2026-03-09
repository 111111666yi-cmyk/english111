import { expressions, passages, sentences, words } from "@/lib/content";
import type { QuizItem } from "@/types/content";

export const vocabularyQuizzes: QuizItem[] = [
  {
    id: "quiz-word-beneficial-meaning",
    type: "single-choice",
    prompt: "Choose the best Chinese meaning for beneficial.",
    promptZh: "选择 beneficial 最合适的中文含义。",
    options: [
      { id: "a", label: "有益的" },
      { id: "b", label: "突然的" },
      { id: "c", label: "吵闹的" }
    ],
    answer: "a",
    explanation: "beneficial 表示对某事有帮助、有正面作用。",
    relatedWords: ["beneficial"],
    difficulty: 3,
    sourceRef: "word-beneficial"
  },
  {
    id: "quiz-word-notice-spelling",
    type: "fill-blank",
    prompt: "Fill in the missing word: Good readers ____ small clues in a sentence.",
    promptZh: "填空：优秀的读者会在句子里 ____ 小线索。",
    answer: "notice",
    explanation: "notice 表示“注意到”，这里强调阅读时发现线索的能力。",
    relatedWords: ["notice"],
    difficulty: 1,
    sourceRef: "word-notice",
    meta: {
      mode: "spelling"
    },
    audioRef: {
      kind: "word",
      cacheKey: "quiz-word-notice",
      localPath: "/audio/words/notice.wav",
      text: "notice"
    }
  },
  {
    id: "quiz-word-organize-match",
    type: "match",
    prompt: "Match the English words with the correct Chinese meanings.",
    promptZh: "将英文单词和正确中文含义配对。",
    answer: ["organize:整理；组织", "bridge:桥梁；纽带"],
    explanation: "通过配对能更快区分高频词义和抽象义。",
    relatedWords: ["organize", "bridge"],
    difficulty: 2,
    sourceRef: "word-organize",
    meta: {
      pairs: [
        { left: "organize", right: "整理；组织" },
        { left: "bridge", right: "桥梁；纽带" }
      ]
    }
  }
];

export const sentenceQuizzes: QuizItem[] = [
  {
    id: "sentence-clues-reorder",
    type: "reorder",
    prompt: "Rebuild the key idea from the Chinese clue.",
    promptZh: "根据中文提示，重组英文顺序。",
    options: sentences[0]?.jumbled.map((label, index) => ({
      id: `sentence-clues-${index}`,
      label
    })),
    answer: "the sentence becomes easier to understand",
    explanation: sentences[0]?.explanation ?? "",
    relatedWords: sentences[0]?.relatedWords ?? [],
    difficulty: sentences[0]?.difficulty ?? 2,
    sourceRef: sentences[0]?.id ?? "sentence-clues"
  },
  {
    id: "sentence-routine-choice",
    type: "single-choice",
    prompt: "What is the main idea of this sentence?",
    promptZh: "这句话的主要意思是什么？",
    options: [
      { id: "a", label: "简短复习能把一天变成更有效的学习安排。" },
      { id: "b", label: "晚饭后最好不要学习。" },
      { id: "c", label: "忙碌的一天不能安排任何任务。" }
    ],
    answer: "a",
    explanation: "句子强调短复习对长期学习习惯的帮助。",
    relatedWords: ["review", "routine"],
    difficulty: 2,
    sourceRef: "sentence-routine",
    audioRef: {
      kind: "sentence",
      cacheKey: "sentence-routine",
      localPath: "/audio/sentences/study-routine.wav",
      text: "A short review after dinner can turn a busy day into a useful study routine."
    }
  }
];

export const expressionQuizzes: QuizItem[] = expressions.map((item) => ({
  id: `${item.id}-quiz`,
  type: "single-choice",
  prompt: `Which advanced expression can replace "${item.basic}"?`,
  promptZh: `哪个进阶表达可以替换 “${item.basic}”？`,
  options: expressions.map((candidate) => ({
    id: candidate.id,
    label: candidate.advanced
  })),
  answer: item.id,
  explanation: item.noteZh,
  relatedWords: [item.basic, item.advanced],
  difficulty: 3,
  sourceRef: item.id,
  audioRef: {
    kind: "expression",
    cacheKey: item.id,
    localPath: item.audioLocalAdvanced,
    text: item.advanced
  }
}));

export const readingQuizzes = passages.flatMap((item) => item.questions);

export const reviewQueue = [
  ...vocabularyQuizzes,
  ...sentenceQuizzes,
  ...readingQuizzes,
  expressionQuizzes[0]
];

export const featuredWords = words.slice(0, 4);
export const featuredSentences = sentences.slice(0, 2);
export const featuredExpressions = expressions.slice(0, 2);
