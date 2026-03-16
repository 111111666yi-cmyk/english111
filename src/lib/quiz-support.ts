import { expressions, words } from "@/lib/content";
import type { QuizItem, QuizOption } from "@/types/content";

const wordMeaningLookup = new Map(words.map((word) => [word.word.toLowerCase(), word.meaningZh]));
const expressionMeaningLookup = new Map<string, string>();

for (const expression of expressions) {
  expressionMeaningLookup.set(expression.advanced.toLowerCase(), expression.meaningZh);
  expressionMeaningLookup.set(expression.basic.toLowerCase(), expression.meaningZh);
}

const IRREGULAR_ENGLISH_FORMS: Record<string, string[]> = {
  went: ["go"],
  gone: ["go"],
  saw: ["see"],
  seen: ["see"],
  did: ["do"],
  done: ["do"],
  was: ["be"],
  were: ["be"],
  been: ["be"],
  had: ["have"],
  better: ["good", "well"],
  best: ["good", "well"],
  worse: ["bad"],
  worst: ["bad"],
  brought: ["bring"],
  bought: ["buy"],
  thought: ["think"],
  taught: ["teach"],
  felt: ["feel"],
  found: ["find"],
  made: ["make"],
  took: ["take"],
  taken: ["take"],
  wrote: ["write"],
  written: ["write"],
  spoke: ["speak"],
  spoken: ["speak"],
  knew: ["know"],
  known: ["know"],
  gave: ["give"],
  given: ["give"],
  ran: ["run"],
  kept: ["keep"],
  left: ["leave"]
};

const CHINESE_SPLIT_PATTERN = /[、，,；;。！？!?\s/／|（）()：:]+/;
const CHINESE_TRAILING_PARTICLES = ["的", "地", "得", "了", "着", "过"];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function normalizeEnglishToken(value: string) {
  return normalize(value).replace(/[.,!?;:()[\]"]/g, "");
}

function splitChineseMeaning(meaning: string) {
  return meaning
    .split(CHINESE_SPLIT_PATTERN)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildChineseVariants(candidate: string) {
  const variants = new Set<string>([candidate]);

  for (const particle of CHINESE_TRAILING_PARTICLES) {
    if (candidate.length > 1 && candidate.endsWith(particle)) {
      variants.add(candidate.slice(0, -1));
    }
  }

  return Array.from(variants).filter(Boolean);
}

function buildRuleBasedEnglishForms(base: string) {
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

  return forms;
}

function buildEnglishForms(keyword: string) {
  const base = normalizeEnglishToken(keyword);
  const forms = new Set<string>([base]);

  for (const candidate of buildRuleBasedEnglishForms(base)) {
    forms.add(candidate);
  }

  for (const irregularBase of IRREGULAR_ENGLISH_FORMS[base] ?? []) {
    forms.add(irregularBase);
    for (const candidate of buildRuleBasedEnglishForms(irregularBase)) {
      forms.add(candidate);
    }
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

function buildVisibleHighlightPatterns(keyword: string) {
  return buildEnglishForms(keyword).map((form) => new RegExp(`\\b${escapeRegExp(form)}\\b`, "i"));
}

export function resolveVisibleHighlights(textEn: string, keywords: string[]) {
  return keywords.filter((keyword) =>
    buildVisibleHighlightPatterns(keyword).some((pattern) => pattern.test(textEn))
  );
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
