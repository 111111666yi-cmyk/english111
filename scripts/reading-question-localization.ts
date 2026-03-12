import type { PassageEntry, QuizItem, QuizOption } from "../src/types/content";

const TRUE_FALSE_TRANSLATIONS: Record<string, string> = {
  true: "正确",
  false: "错误"
};

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function ensureQuestionId(question: QuizItem) {
  if (!question.questionId) {
    throw new Error(`Reading question ${question.id} must provide questionId.`);
  }
}

function ensureOptionTranslations(question: QuizItem, options?: QuizOption[]) {
  if (!options?.length) {
    return;
  }

  for (const option of options) {
    if (!option.translationZh) {
      throw new Error(
        `Reading question ${question.id} option ${option.id} must provide translationZh.`
      );
    }
  }
}

function ensurePromptZh(question: QuizItem) {
  if (!question.promptZh) {
    throw new Error(`Reading question ${question.id} must provide promptZh.`);
  }
}

function ensureAnswerText(question: QuizItem) {
  if (!question.answerText) {
    throw new Error(`Reading question ${question.id} must provide answerText.`);
  }
}

function ensureTrueFalseSupplement(question: QuizItem) {
  if (question.meta?.mode === "true-false" && !question.promptSupplementZh) {
    throw new Error(`True/false reading question ${question.id} must provide promptSupplementZh.`);
  }
}

function normalizeOption(option: QuizOption) {
  const normalizedTranslation =
    option.translationZh ?? TRUE_FALSE_TRANSLATIONS[option.id.trim().toLowerCase()];

  return {
    ...option,
    label: normalizeText(option.label),
    translationZh: normalizedTranslation,
    detail: option.detail ?? normalizedTranslation
  };
}

export function localizeReadingQuestion(question: QuizItem) {
  if (question.type !== "reading-question") {
    return question;
  }

  const normalizedQuestion = {
    ...question,
    questionId: question.questionId,
    prompt: normalizeText(question.prompt),
    promptZh: question.promptZh ? normalizeText(question.promptZh) : question.promptZh,
    promptSupplementZh: question.promptSupplementZh
      ? normalizeText(question.promptSupplementZh)
      : question.promptSupplementZh,
    answerText: question.answerText ? normalizeText(question.answerText) : question.answerText,
    options: question.options?.map(normalizeOption)
  };

  ensureQuestionId(normalizedQuestion);
  ensurePromptZh(normalizedQuestion);
  ensureAnswerText(normalizedQuestion);
  ensureTrueFalseSupplement(normalizedQuestion);
  ensureOptionTranslations(normalizedQuestion, normalizedQuestion.options);

  return normalizedQuestion;
}

export function localizePassages(passages: PassageEntry[]) {
  return passages.map((passage) => ({
    ...passage,
    questions: passage.questions.map(localizeReadingQuestion)
  }));
}
