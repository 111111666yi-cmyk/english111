import { expressions, passages, sentences, words } from "@/lib/content";
import {
  buildBlankedChineseText,
  resolveVisibleHighlights
} from "@/lib/quiz-support";
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

const wordMeaningLookup = new Map(words.map((word) => [word.word.toLowerCase(), word.meaningZh]));
const wordIndexById = new Map(words.map((word, index) => [word.id, index]));
const sentenceIndexById = new Map(sentences.map((sentence, index) => [sentence.id, index]));
const expressionIndexById = new Map(expressions.map((expression, index) => [expression.id, index]));

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
      answerText: word.meaningZh,
      explanation: `${word.word} 在这里对应的核心含义是“${word.meaningZh}”。`,
      relatedWords: [word.word],
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
    promptSupplementZh: buildBlankedChineseText(word.exampleZh, word.word),
    answer: word.word,
    answerText: word.word,
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

function makeSentenceQuiz(index: number): QuizItem {
  const sentence = sentences[index];
  const visibleKeywords = resolveVisibleHighlights(sentence.sentenceEn, sentence.keywords);

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
      answerText: sentence.reorderAnswer,
      explanation: sentence.explanation,
      relatedWords: visibleKeywords,
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
      prompt: sentence.sentenceEn.replace(new RegExp(sentence.missingWord, "i"), "_____"),
      promptZh: "请选择最适合填入句子的关键词。",
      promptSupplementZh: buildBlankedChineseText(sentence.sentenceZh, sentence.missingWord),
      options: uniqueOptions.map((option, optionIndex) => ({
        id: option === sentence.missingWord ? "correct" : `option-${optionIndex}`,
        label: option
      })),
      answer: "correct",
      answerText: sentence.missingWord,
      explanation: sentence.explanation,
      relatedWords: [sentence.missingWord],
      difficulty: sentence.difficulty,
      sourceRef: sentence.id
    };
  }

  const pairs = visibleKeywords
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
      answerText: pairs.map((item) => `${item.left} -> ${item.right}`).join(" / "),
      explanation: "关键词和含义配对能帮助你在语境里更快识别重点词。",
      relatedWords: visibleKeywords,
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
    prompt: sentence.sentenceEn.replace(new RegExp(sentence.missingWord, "i"), "_____"),
    promptZh: "请根据上下文填写缺失的单词。",
    promptSupplementZh: buildBlankedChineseText(sentence.sentenceZh, sentence.missingWord),
    answer: sentence.missingWord,
    answerText: sentence.missingWord,
    explanation: sentence.explanation,
    relatedWords: [sentence.missingWord],
    difficulty: sentence.difficulty,
    sourceRef: sentence.id
  };
}

function makeExpressionQuiz(index: number): QuizItem {
  const item = expressions[index];
  const optionIndexes = Array.from({ length: Math.min(4, expressions.length) }, (_, offset) => (
    index + offset
  ) % expressions.length);

  return {
    id: `${item.id}-quiz`,
    type: "single-choice",
    prompt: `Which advanced expression can replace "${item.basic}"?`,
    promptZh: `哪个进阶表达可以替换 “${item.basic}”？`,
    options: optionIndexes.map((optionIndex) => ({
      id: expressions[optionIndex].id,
      label: expressions[optionIndex].advanced
    })),
    answer: item.id,
    answerText: item.advanced,
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
  };
}

export function getVocabularyQuiz(wordIndex: number) {
  return makeVocabularyQuiz(wordIndex % words.length);
}

export function getSentenceQuiz(index: number) {
  return makeSentenceQuiz(index % sentences.length);
}

export function getExpressionQuiz(index: number) {
  return makeExpressionQuiz(index % expressions.length);
}

function stripKnownSuffix(value: string, suffixes: string[]) {
  const match = suffixes.find((suffix) => value.endsWith(suffix));
  return match ? value.slice(0, -match.length) : value;
}

export function getQuizById(quizId: string) {
  if (quizId.endsWith("-quiz")) {
    const expressionId = quizId.slice(0, -"-quiz".length);
    const expressionIndex = expressionIndexById.get(expressionId);
    return expressionIndex === undefined ? undefined : getExpressionQuiz(expressionIndex);
  }

  if (quizId.startsWith("quiz-word-") || quizId.startsWith("quiz-auto-word-")) {
    const wordId = stripKnownSuffix(quizId.slice(5), ["-meaning", "-spelling"]);
    const wordIndex = wordIndexById.get(wordId);
    return wordIndex === undefined ? undefined : getVocabularyQuiz(wordIndex);
  }

  if (quizId.startsWith("quiz-sentence-") || quizId.startsWith("quiz-auto-sentence-")) {
    const sentenceId = stripKnownSuffix(quizId.slice(5), ["-reorder", "-choice", "-match", "-blank"]);
    const sentenceIndex = sentenceIndexById.get(sentenceId);
    return sentenceIndex === undefined ? undefined : getSentenceQuiz(sentenceIndex);
  }

  for (const passage of passages) {
    const question = passage.questions.find((item) => item.id === quizId);
    if (question) {
      return question;
    }
  }

  return undefined;
}

function sampleIndexes(length: number, limit: number) {
  if (length <= limit) {
    return Array.from({ length }, (_, index) => index);
  }

  const step = length / limit;
  const indexes = new Set<number>();

  for (let slot = 0; slot < limit; slot += 1) {
    indexes.add(Math.min(length - 1, Math.floor(slot * step)));
  }

  return Array.from(indexes);
}

export function getReviewPoolSize() {
  const readingCount = passages.reduce((total, passage) => total + passage.questions.length, 0);
  return words.length + sentences.length + expressions.length + readingCount;
}

export function getReviewQueue(reviewMistakeIds: string[], limit = 120) {
  const queue: QuizItem[] = [];
  const seen = new Set<string>();

  for (const quizId of reviewMistakeIds) {
    const quiz = getQuizById(quizId);
    if (quiz && !seen.has(quiz.id)) {
      queue.push(quiz);
      seen.add(quiz.id);
    }
  }

  const addQuiz = (quiz: QuizItem) => {
    if (!seen.has(quiz.id) && queue.length < limit) {
      queue.push(quiz);
      seen.add(quiz.id);
    }
  };

  for (const index of sampleIndexes(words.length, 36)) {
    addQuiz(getVocabularyQuiz(index));
  }

  for (const index of sampleIndexes(sentences.length, 48)) {
    addQuiz(getSentenceQuiz(index));
  }

  for (const passageIndex of sampleIndexes(passages.length, 18)) {
    for (const question of passages[passageIndex].questions) {
      addQuiz(question);
    }
  }

  for (const index of sampleIndexes(expressions.length, expressions.length)) {
    addQuiz(getExpressionQuiz(index));
  }

  return queue;
}
