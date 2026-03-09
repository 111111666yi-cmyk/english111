import expressionsJson from "@/data/expressions.json";
import passagesJson from "@/data/passages.json";
import sentencesJson from "@/data/sentences.json";
import wordsJson from "@/data/words.json";
import type {
  ExpressionEntry,
  PassageEntry,
  SentenceEntry,
  WordEntry
} from "@/types/content";

export const words = wordsJson as unknown as WordEntry[];
export const sentences = sentencesJson as unknown as SentenceEntry[];
export const passages = passagesJson as unknown as PassageEntry[];
export const expressions = expressionsJson as unknown as ExpressionEntry[];
