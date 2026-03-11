import { expressions, words } from "@/lib/content";
import type { QuizItem, QuizOption } from "@/types/content";

const wordMeaningLookup = new Map(words.map((word) => [word.word.toLowerCase(), word.meaningZh]));
const expressionMeaningLookup = new Map<string, string>();

for (const expression of expressions) {
  expressionMeaningLookup.set(expression.advanced.toLowerCase(), expression.meaningZh);
  expressionMeaningLookup.set(expression.basic.toLowerCase(), expression.meaningZh);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function splitChineseMeaning(meaning: string) {
  return meaning
    .split(/[；、，,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildChineseVariants(candidate: string) {
  const variants = new Set<string>([candidate]);

  if (candidate.endsWith("的") || candidate.endsWith("地")) {
    variants.add(candidate.slice(0, -1));
  }

  if (candidate.endsWith("了")) {
    variants.add(candidate.slice(0, -1));
  }

  return Array.from(variants).filter(Boolean);
}

function buildEnglishForms(keyword: string) {
  const base = normalize(keyword).replace(/[.,!?]/g, "");
  const forms = new Set<string>([base]);

  if (base.endsWith("ies") && base.length > 3) {
    forms.add(`${base.slice(0, -3)}y`);
  }

  if (base.endsWith("ed") && base.length > 3) {
    forms.add(base.slice(0, -2));
    forms.add(base.slice(0, -1));
  }

  if (base.endsWith("ing") && base.length > 4) {
    forms.add(base.slice(0, -3));
    forms.add(`${base.slice(0, -3)}e`);
  }

  if (base.endsWith("es") && base.length > 3) {
    forms.add(base.slice(0, -2));
  }

  if (base.endsWith("s") && base.length > 2) {
    forms.add(base.slice(0, -1));
  }

  return Array.from(forms).filter(Boolean);
}

function getChineseCandidates(keyword: string) {
  const matches = new Set<string>();

  for (const form of buildEnglishForms(keyword)) {
    const meaning = wordMeaningLookup.get(form) ?? expressionMeaningLookup.get(form);

    if (!meaning) {
      continue;
    }

    for (const part of splitChineseMeaning(meaning)) {
      for (const variant of buildChineseVariants(part)) {
        matches.add(variant);
      }
    }
  }

  return Array.from(matches).sort((left, right) => right.length - left.length);
}

export function resolveVisibleHighlights(textEn: string, keywords: string[]) {
  return keywords.filter((keyword) => {
    const pattern = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, "i");
    return pattern.test(textEn);
  });
}

export function resolveChineseHighlights(textZh: string, keywords: string[]) {
  const highlights = new Set<string>();

  for (const keyword of keywords) {
    for (const candidate of getChineseCandidates(keyword)) {
      if (textZh.includes(candidate)) {
        highlights.add(candidate);
      }
    }
  }

  return Array.from(highlights).sort((left, right) => right.length - left.length);
}

export function buildBlankedChineseText(textZh: string, keyword: string) {
  const [match] = resolveChineseHighlights(textZh, [keyword]);
  return match ? textZh.replace(match, "_____") : textZh;
}

function resolveTokenAnswerText(token: string, options?: QuizOption[]) {
  if (token.includes(":")) {
    return token.replace(":", " -> ");
  }

  const option = options?.find((item) => normalize(item.id) === normalize(token));

  if (option) {
    return option.translationZh ? `${option.label}（${option.translationZh}）` : option.label;
  }

  if (normalize(token) === "true") {
    return "True（正确）";
  }

  if (normalize(token) === "false") {
    return "False（错误）";
  }

  return token;
}

export function resolveQuizAnswerText(quiz: QuizItem) {
  if (quiz.answerText) {
    return quiz.answerText;
  }

  if (Array.isArray(quiz.answer)) {
    return quiz.answer.map((item) => resolveTokenAnswerText(item, quiz.options)).join(" / ");
  }

  return resolveTokenAnswerText(String(quiz.answer), quiz.options);
}
