import { expressions, passages, sentences, words } from "@/lib/content";
import type { QuizItem, QuizOption } from "@/types/content";

function pickMeaningOptions(index: number): QuizOption[] {
  const target = words[index];
  const pool = words.filter((item) => item.id !== target.id);
  const distractors = [1, 2, 3].map((step) => pool[(index + step) % pool.length]);
  const options = [
    { id: "correct", label: target.meaningZh },
    ...distractors.map((item) => ({ id: item.id, label: item.meaningZh }))
  ];

  const offset = index % options.length;
  return [...options.slice(offset), ...options.slice(0, offset)];
}

function makeVocabularyQuiz(wordIndex: number): QuizItem {
  const word = words[wordIndex];

  if (wordIndex % 2 === 0) {
    return {
      id: `quiz-${word.id}-meaning`,
      type: "single-choice",
      prompt: `Choose the best Chinese meaning for ${word.word}.`,
      promptZh: `请选择 ${word.word} 最准确的中文意思。`,
      options: pickMeaningOptions(wordIndex).map((option) => ({
        id: option.id,
        label: option.label
      })),
      answer: "correct",
      explanation: `${word.word} 在这里对应的核心含义是“${word.meaningZh}”。`,
      relatedWords: [word.word, ...(word.synonyms ?? []).slice(0, 1)],
      difficulty: word.difficulty,
      sourceRef: word.id,
      audioRef: {
        kind: "word",
        cacheKey: `quiz-${word.id}`,
        localPath: word.audioLocal,
        text: word.word
      }
    };
  }

  return {
    id: `quiz-${word.id}-spelling`,
    type: "fill-blank",
    prompt: word.exampleEn.replace(new RegExp(word.word, "i"), "_____"),
    promptZh: "根据例句填写缺失的单词。",
    answer: word.word,
    explanation: `例句中的关键词是 ${word.word}。`,
    relatedWords: [word.word],
    difficulty: word.difficulty,
    sourceRef: word.id,
    meta: {
      mode: "spelling"
    },
    audioRef: {
      kind: "word",
      cacheKey: `quiz-${word.id}-audio`,
      localPath: word.audioLocal,
      text: word.word
    }
  };
}

const wordMeaningLookup = new Map(words.map((word) => [word.word.toLowerCase(), word.meaningZh]));

function makeSentenceQuiz(index: number): QuizItem {
  const sentence = sentences[index];

  if (index % 3 === 0) {
    return {
      id: `quiz-${sentence.id}-reorder`,
      type: "reorder",
      prompt: "Rebuild the key part of the sentence.",
      promptZh: "根据提示重组句子的关键部分。",
      options: sentence.jumbled.map((label, tokenIndex) => ({
        id: `${sentence.id}-${tokenIndex}`,
        label
      })),
      answer: sentence.reorderAnswer,
      explanation: sentence.explanation,
      relatedWords: sentence.relatedWords,
      difficulty: sentence.difficulty,
      sourceRef: sentence.id,
      audioRef: {
        kind: "sentence",
        cacheKey: `quiz-${sentence.id}`,
        localPath: sentence.audioLocal,
        text: sentence.sentenceEn
      }
    };
  }

  if (index % 3 === 1) {
    const optionWords = [sentence.missingWord, ...sentence.relatedWords].filter(Boolean).slice(0, 4);
    const uniqueOptions = Array.from(new Set(optionWords));

    return {
      id: `quiz-${sentence.id}-choice`,
      type: "single-choice",
      prompt: sentence.sentenceEn.replace(
        new RegExp(sentence.missingWord, "i"),
        "_____"
      ),
      promptZh: "请选择最适合填入句子的关键词。",
      options: uniqueOptions.map((option, optionIndex) => ({
        id: option === sentence.missingWord ? "correct" : `option-${optionIndex}`,
        label: option
      })),
      answer: "correct",
      explanation: sentence.explanation,
      relatedWords: sentence.relatedWords,
      difficulty: sentence.difficulty,
      sourceRef: sentence.id
    };
  }

  const pairs = sentence.relatedWords
    .map((item) => ({
      left: item,
      right: wordMeaningLookup.get(item.toLowerCase())
    }))
    .filter((item): item is { left: string; right: string } => Boolean(item.right))
    .slice(0, 3);

  if (pairs.length >= 2) {
    return {
      id: `quiz-${sentence.id}-match`,
      type: "match",
      prompt: "Match the keywords with their Chinese meanings.",
      promptZh: "把关键词和对应中文意思配对。",
      answer: pairs.map((item) => `${item.left}:${item.right}`),
      explanation: "关键词和含义配对能帮助你在语境里更快识别重点词。",
      relatedWords: sentence.relatedWords,
      difficulty: sentence.difficulty,
      sourceRef: sentence.id,
      meta: {
        pairs
      }
    };
  }

  return {
    id: `quiz-${sentence.id}-blank`,
    type: "fill-blank",
    prompt: sentence.sentenceEn.replace(
      new RegExp(sentence.missingWord, "i"),
      "_____"
    ),
    promptZh: "请根据上下文填写缺失的单词。",
    answer: sentence.missingWord,
    explanation: sentence.explanation,
    relatedWords: sentence.relatedWords,
    difficulty: sentence.difficulty,
    sourceRef: sentence.id
  };
}

export const vocabularyQuizzes: QuizItem[] = words.map((_, index) => makeVocabularyQuiz(index));
export const sentenceQuizzes: QuizItem[] = sentences.map((_, index) => makeSentenceQuiz(index));

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
  ...expressionQuizzes
];

export const featuredWords = words.slice(0, 4);
export const featuredSentences = sentences.slice(0, 2);
export const featuredExpressions = expressions.slice(0, 2);
