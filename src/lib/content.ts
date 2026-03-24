import expressionsBetaJson from "../../English2/data/expressions.json";
import passagesBetaJson from "../../English2/data/passages.json";
import releaseWordIdsBetaJson from "../../English2/data/release-word-ids.json";
import sentencesBetaJson from "../../English2/data/sentences.json";
import wordsBetaJson from "../../English2/data/words.json";
import expressionsJson from "@/data/expressions.json";
import passagesJson from "@/data/passages.json";
import releaseWordIdsJson from "@/data/release-word-ids.json";
import sentencesJson from "@/data/sentences.json";
import wordsJson from "@/data/words.json";
import contentSummaryBetaJson from "../../English2/data/content-summary.json";
import contentSummaryJson from "@/data/content-summary.json";
import type {
  ContentSummary,
  ExpressionEntry,
  PassageEntry,
  SentenceEntry,
  WordEntry
} from "@/types/content";
import { appConfig } from "@/lib/app-config";

const releaseWordIdsSource = (
  appConfig.isBeta ? releaseWordIdsBetaJson : releaseWordIdsJson
) as string[];

export const words = (appConfig.isBeta ? wordsBetaJson : wordsJson) as unknown as WordEntry[];
export const sentences = (appConfig.isBeta ? sentencesBetaJson : sentencesJson) as unknown as SentenceEntry[];
export const passages = (appConfig.isBeta ? passagesBetaJson : passagesJson) as unknown as PassageEntry[];
export const expressions = (appConfig.isBeta ? expressionsBetaJson : expressionsJson) as unknown as ExpressionEntry[];
export const contentSummary = (appConfig.isBeta ? contentSummaryBetaJson : contentSummaryJson) as ContentSummary;

export const releaseWordIds = Array.from(
  new Set(releaseWordIdsSource.filter((wordId) => words.some((word) => word.id === wordId)))
);
export const releaseWordIdSet = new Set(releaseWordIds);
export const releaseWords = words.filter((word) => releaseWordIdSet.has(word.id));
export const libraryOnlyWords = words.filter((word) => !releaseWordIdSet.has(word.id));
export const releaseWordCount = releaseWords.length;
export const wordById = new Map(words.map((word) => [word.id, word]));
export const releaseWordIndexById = new Map(releaseWords.map((word, index) => [word.id, index]));

export function isReleaseWordId(wordId: string) {
  return releaseWordIdSet.has(wordId);
}

export function filterReleaseWordIds(wordIds: string[]) {
  return Array.from(new Set(wordIds.filter((wordId) => releaseWordIdSet.has(wordId))));
}

export function countReleaseWordIds(wordIds: string[]) {
  return filterReleaseWordIds(wordIds).length;
}

export const releaseContentSummary: ContentSummary = {
  ...contentSummary,
  totals: {
    ...contentSummary.totals,
    words: releaseWordCount,
    reviewPool: contentSummary.totals.reviewPool - contentSummary.totals.words + releaseWordCount
  },
  featuredWords: contentSummary.featuredWords.filter((word) => releaseWordIdSet.has(word.id))
};
