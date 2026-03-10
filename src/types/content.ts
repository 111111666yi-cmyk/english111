export type Level = "L1" | "L2" | "L3" | "L4" | "L5";

export type MasteryFeedback = "known" | "tricky" | "unknown";

export type AudioKind = "word" | "sentence" | "passage" | "expression";

export interface AudioRef {
  kind: AudioKind;
  cacheKey: string;
  localPath?: string;
  text?: string;
}

export interface WordEntry {
  id: string;
  word: string;
  phonetic?: string;
  partOfSpeech: string;
  meaningZh: string;
  level: Level;
  tags: string[];
  exampleEn: string;
  exampleZh: string;
  synonyms?: string[];
  pronunciationText?: string;
  difficulty: number;
  audioLocal?: string;
}

export interface SentenceEntry {
  id: string;
  sentenceEn: string;
  sentenceZh: string;
  keywords: string[];
  difficulty: number;
  grammarPoint?: string;
  relatedWords: string[];
  jumbled: string[];
  reorderAnswer: string;
  missingWord: string;
  explanation: string;
  audioLocal?: string;
  keywordAudio?: Record<string, string>;
}

export interface QuizOption {
  id: string;
  label: string;
  detail?: string;
}

export interface QuizPair {
  left: string;
  right: string;
}

export interface QuizItem {
  id: string;
  type:
    | "single-choice"
    | "fill-blank"
    | "match"
    | "reorder"
    | "reading-question";
  prompt: string;
  promptZh?: string;
  options?: QuizOption[];
  answer: string | string[] | boolean;
  explanation: string;
  relatedWords: string[];
  difficulty: number;
  sourceRef: string;
  audioRef?: AudioRef;
  meta?: {
    pairs?: QuizPair[];
    mode?: "true-false" | "reading" | "meaning" | "spelling";
  };
}

export interface PassageEntry {
  id: string;
  title: string;
  level: Level;
  topic: string;
  contentEn: string[];
  contentZh: string[];
  keyWords: string[];
  questions: QuizItem[];
  estimatedMinutes: number;
  audioLocal?: string;
  paragraphAudio?: string[];
}

export interface ExpressionEntry {
  id: string;
  level: Level;
  basic: string;
  advanced: string;
  meaningZh: string;
  exampleBasic: string;
  exampleAdvanced: string;
  noteZh: string;
  audioLocalBasic?: string;
  audioLocalAdvanced?: string;
}
