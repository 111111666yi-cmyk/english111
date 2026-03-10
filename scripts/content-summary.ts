import type {
  ContentSummary,
  ExpressionEntry,
  PassageEntry,
  SentenceEntry,
  WordEntry
} from "../src/types/content";

export function createContentSummary(
  words: WordEntry[],
  sentences: SentenceEntry[],
  passages: PassageEntry[],
  expressions: ExpressionEntry[]
): ContentSummary {
  return {
    totals: {
      words: words.length,
      sentences: sentences.length,
      passages: passages.length,
      expressions: expressions.length,
      reviewPool:
        words.length +
        sentences.length +
        expressions.length +
        passages.reduce((total, passage) => total + passage.questions.length, 0)
    },
    featuredWords: words.slice(0, 4).map((word) => ({
      id: word.id,
      word: word.word,
      level: word.level,
      meaningZh: word.meaningZh
    })),
    featuredSentences: sentences.slice(0, 2).map((sentence) => ({
      id: sentence.id,
      sentenceEn: sentence.sentenceEn,
      sentenceZh: sentence.sentenceZh
    })),
    featuredExpressions: expressions.slice(0, 2).map((expression) => ({
      id: expression.id,
      basic: expression.basic,
      advanced: expression.advanced,
      meaningZh: expression.meaningZh
    }))
  };
}
