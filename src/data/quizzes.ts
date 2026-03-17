import { expressions, passages, sentences, words } from "@/lib/content";
import { resolveVisibleHighlights } from "@/lib/quiz-support";
import type { ReviewMistakeEvent, StudyMode } from "@/stores/learning-store";
import type { QuizItem, QuizOption } from "@/types/content";

function pickMeaningOptions(index: number): QuizOption[] {
  const target = words[index];
  const seen = new Set<string>();
  const options: QuizOption[] = [];

  const addOption = (id: string, label: string) => {
    const normalized = label.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    options.push({ id, label });
  };

  addOption("correct", target.meaningZh);

  for (let offset = 1; offset < words.length && options.length < 4; offset += 1) {
    const candidate = words[(index + offset) % words.length];
    if (candidate.id !== target.id) {
      addOption(candidate.id, candidate.meaningZh);
    }
  }

  const offset = index % options.length;
  return [...options.slice(offset), ...options.slice(0, offset)];
}

const wordMeaningLookup = new Map(words.map((word) => [word.word.toLowerCase(), word.meaningZh]));
const wordEntryByLabel = new Map(words.map((word) => [word.word.toLowerCase(), word]));
const wordIndexById = new Map(words.map((word, index) => [word.id, index]));
const sentenceIndexById = new Map(sentences.map((sentence, index) => [sentence.id, index]));
const expressionIndexById = new Map(expressions.map((expression, index) => [expression.id, index]));
const MIN_EXPRESSION_QUIZ_SAMPLES = 8;

export function canGenerateExpressionQuiz() {
  return expressions.length >= MIN_EXPRESSION_QUIZ_SAMPLES;
}

function buildSentenceChoiceOptions(sentenceIndex: number) {
  const sentence = sentences[sentenceIndex];
  const answer = sentence.missingWord;
  const answerKey = answer.toLowerCase();
  const answerEntry = wordEntryByLabel.get(answerKey);
  const optionLabels: string[] = [];
  const seen = new Set<string>();

  const addOption = (label?: string) => {
    if (!label) {
      return;
    }

    const normalized = label.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    optionLabels.push(label);
  };

  addOption(answer);
  sentence.relatedWords.forEach(addOption);

  if (answerEntry) {
    for (const candidate of words) {
      if (candidate.word.toLowerCase() === answerKey) {
        continue;
      }

      if (candidate.partOfSpeech === answerEntry.partOfSpeech && candidate.level === answerEntry.level) {
        addOption(candidate.word);
      }

      if (optionLabels.length >= 4) {
        break;
      }
    }
  }

  if (optionLabels.length < 4) {
    for (let offset = 1; offset < words.length && optionLabels.length < 4; offset += 1) {
      const candidate = words[(sentenceIndex + offset) % words.length];
      if (candidate.word.toLowerCase() !== answerKey) {
        addOption(candidate.word);
      }
    }
  }

  const ordered = optionLabels.slice(0, 4).map((label, optionIndex) => ({
    id: label.toLowerCase() === answerKey ? "correct" : `option-${optionIndex}`,
    label
  }));

  const offset = sentenceIndex % ordered.length;
  return [...ordered.slice(offset), ...ordered.slice(0, offset)];
}

function makeVocabularyChoiceQuiz(wordIndex: number): QuizItem {
  const word = words[wordIndex];

  return {
    id: `quiz-${word.id}-meaning`,
    type: "single-choice",
    prompt: `Choose the best Chinese meaning for ${word.word}.`,
    promptZh: `Select the most accurate Chinese meaning for ${word.word}.`,
    promptSupplementZh: word.exampleZh,
    options: pickMeaningOptions(wordIndex).map((option) => ({
      id: option.id,
      label: option.label
    })),
    answer: "correct",
    answerText: word.meaningZh,
    explanation: `${word.word} matches "${word.meaningZh}" in this context.`,
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

function makeVocabularyFillBlankQuiz(wordIndex: number): QuizItem {
  const word = words[wordIndex];

  return {
    id: `quiz-${word.id}-spelling`,
    type: "fill-blank",
    prompt: word.exampleEn.replace(new RegExp(word.word, "i"), "_____"),
    promptZh: "Fill in the missing word from the example sentence.",
    promptSupplementZh: word.exampleZh,
    answer: word.word,
    answerText: word.word,
    explanation: `The missing keyword is ${word.word}.`,
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
      promptZh: "Reorder the key phrase into the correct sentence.",
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
    return {
      id: `quiz-${sentence.id}-choice`,
      type: "single-choice",
      prompt: sentence.sentenceEn.replace(new RegExp(sentence.missingWord, "i"), "_____"),
      promptZh: "Choose the best word to complete the sentence.",
      promptSupplementZh: sentence.sentenceZh,
      options: buildSentenceChoiceOptions(index),
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
      promptZh: "Match each keyword with the correct Chinese meaning.",
      answer: pairs.map((item) => `${item.left}:${item.right}`),
      answerText: pairs.map((item) => `${item.left} -> ${item.right}`).join(" / "),
      explanation: "Matching keywords with meanings helps anchor the sentence in context.",
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
    promptZh: "Fill in the missing word from context.",
    promptSupplementZh: sentence.sentenceZh,
    answer: sentence.missingWord,
    answerText: sentence.missingWord,
    explanation: sentence.explanation,
    relatedWords: [sentence.missingWord],
    difficulty: sentence.difficulty,
    sourceRef: sentence.id
  };
}

function makeExpressionQuiz(index: number): QuizItem {
  if (!canGenerateExpressionQuiz()) {
    return buildQuizLookupError(`expression-pool-too-small-${expressions.length}`);
  }

  const item = expressions[index];
  const optionIndexes = Array.from({ length: Math.min(4, expressions.length) }, (_, offset) => (
    index + offset
  ) % expressions.length);

  return {
    id: `${item.id}-quiz`,
    type: "single-choice",
    prompt: `Which advanced expression can replace "${item.basic}"?`,
    promptZh: `Which advanced expression can replace "${item.basic}"?`,
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

export function getVocabularyQuiz(wordIndex: number, mode: StudyMode = "simple") {
  const safeIndex = wordIndex % words.length;
  return mode === "hard"
    ? makeVocabularyFillBlankQuiz(safeIndex)
    : makeVocabularyChoiceQuiz(safeIndex);
}

export function getSentenceQuiz(index: number) {
  return makeSentenceQuiz(index % sentences.length);
}

export function getExpressionQuiz(index: number) {
  if (!canGenerateExpressionQuiz()) {
    return buildQuizLookupError(`expression-pool-too-small-${expressions.length}`);
  }

  return makeExpressionQuiz(index % expressions.length);
}

function buildQuizLookupError(quizId: string): QuizItem {
  return {
    id: `quiz-error-${quizId}`,
    type: "error",
    prompt: "This quiz item could not be loaded.",
    promptZh: "This quiz item could not be loaded.",
    answer: "",
    answerText: "",
    explanation: "Refresh the page and try again. If the issue persists, the quiz index needs checking.",
    relatedWords: [],
    difficulty: 0,
    sourceRef: quizId,
    errorMessage: quizId
  };
}

function stripKnownSuffix(value: string, suffixes: string[]) {
  const match = suffixes.find((suffix) => value.endsWith(suffix));
  return match ? value.slice(0, -match.length) : value;
}

function resolveAutoWordQuizId(quizId: string) {
  return stripKnownSuffix(quizId.slice("quiz-auto-word-".length), ["-meaning", "-spelling"]);
}

function resolveWordQuizId(quizId: string) {
  return stripKnownSuffix(quizId.slice("quiz-".length), ["-meaning", "-spelling"]);
}

function resolveAutoSentenceQuizId(quizId: string) {
  return stripKnownSuffix(quizId.slice("quiz-auto-sentence-".length), [
    "-reorder",
    "-choice",
    "-match",
    "-blank"
  ]);
}

function resolveSentenceQuizId(quizId: string) {
  return stripKnownSuffix(quizId.slice("quiz-".length), [
    "-reorder",
    "-choice",
    "-match",
    "-blank"
  ]);
}

export function getQuizById(quizId: string, mode: StudyMode = "simple") {
  if (quizId.endsWith("-quiz")) {
    const expressionId = quizId.slice(0, -"-quiz".length);
    const expressionIndex = expressionIndexById.get(expressionId);
    return expressionIndex === undefined ? buildQuizLookupError(quizId) : getExpressionQuiz(expressionIndex);
  }

  if (quizId.startsWith("quiz-auto-word-")) {
    const wordId = resolveAutoWordQuizId(quizId);
    const wordIndex = wordIndexById.get(wordId);
    return wordIndex === undefined ? buildQuizLookupError(quizId) : getVocabularyQuiz(wordIndex, mode);
  }

  if (quizId.startsWith("quiz-word-")) {
    const wordId = resolveWordQuizId(quizId);
    const wordIndex = wordIndexById.get(wordId);
    return wordIndex === undefined ? buildQuizLookupError(quizId) : getVocabularyQuiz(wordIndex, mode);
  }

  if (quizId.startsWith("quiz-auto-sentence-")) {
    const sentenceId = resolveAutoSentenceQuizId(quizId);
    const sentenceIndex = sentenceIndexById.get(sentenceId);
    return sentenceIndex === undefined ? buildQuizLookupError(quizId) : getSentenceQuiz(sentenceIndex);
  }

  if (quizId.startsWith("quiz-sentence-")) {
    const sentenceId = resolveSentenceQuizId(quizId);
    const sentenceIndex = sentenceIndexById.get(sentenceId);
    return sentenceIndex === undefined ? buildQuizLookupError(quizId) : getSentenceQuiz(sentenceIndex);
  }

  for (const passage of passages) {
    const question = passage.questions.find((item) => item.id === quizId);
    if (question) {
      return question;
    }
  }

  return buildQuizLookupError(quizId);
}

export function getReviewPoolSize(reviewMistakes: ReviewMistakeEvent[]) {
  return reviewMistakes.length;
}

export function getReviewQueue(reviewMistakes: ReviewMistakeEvent[], limit = 120, mode: StudyMode = "simple") {
  return reviewMistakes
    .slice()
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .slice(0, limit)
    .map((event) => ({
      event,
      quiz: getQuizById(event.quizId, mode)
    }));
}
