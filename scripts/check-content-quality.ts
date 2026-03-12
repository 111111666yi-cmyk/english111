import { expressions, passages, sentences, words } from "@/lib/content";
import {
  canGenerateExpressionQuiz,
  getExpressionQuiz,
  getSentenceQuiz,
  getVocabularyQuiz
} from "@/data/quizzes";
import type { QuizItem } from "@/types/content";

type Severity = "error" | "warn";

interface Finding {
  severity: Severity;
  code: string;
  message: string;
}

const findings: Finding[] = [];

function addFinding(severity: Severity, code: string, message: string) {
  findings.push({ severity, code, message });
}

function normalizeLabel(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function checkReadingLocalization() {
  for (const passage of passages) {
    for (const question of passage.questions) {
      if (question.type !== "reading-question") {
        continue;
      }

      if (!question.questionId?.trim()) {
        addFinding(
          "error",
          "reading.missing-question-id",
          `${passage.id}/${question.id} 缺少稳定 questionId。`
        );
      }

      if (!question.promptZh?.trim()) {
        addFinding(
          "error",
          "reading.missing-prompt-zh",
          `${passage.id}/${question.id} 缺少中文题干 promptZh。`
        );
      }

      if (question.meta?.mode === "true-false" && !question.promptSupplementZh?.trim()) {
        addFinding(
          "error",
          "reading.missing-true-false-translation",
          `${passage.id}/${question.id} 缺少判断题中文补充说明 promptSupplementZh。`
        );
      }

      const options = question.options ?? [];
      if (options.length < 2) {
        addFinding(
          "warn",
          "reading.too-few-options",
          `${passage.id}/${question.id} 选项数量过少，训练价值偏低。`
        );
      }

      for (const option of options) {
        if (!option.translationZh?.trim()) {
          addFinding(
            "error",
            "reading.missing-option-translation",
            `${passage.id}/${question.id}/${option.id} 缺少选项中文 translationZh。`
          );
        }
      }
    }
  }
}

function checkExpressions() {
  if (expressions.length < 8) {
    addFinding(
      "warn",
      "expression.disabled",
      `expression 数据仅 ${expressions.length} 条，小于 8 条时应禁用该题型。`
    );
    return;
  }

  if (!canGenerateExpressionQuiz()) {
    addFinding(
      "error",
      "expression.generator-disabled",
      "expression 数据已达最小阈值，但题型生成器仍返回禁用。"
    );
  }

  for (let index = 0; index < expressions.length; index += 1) {
    const quiz = getExpressionQuiz(index);
    inspectChoiceDistractors(quiz, `expression:${quiz.id}`);
  }
}

function inspectChoiceDistractors(quiz: QuizItem, origin: string) {
  if (quiz.type !== "single-choice") {
    return;
  }

  const options = quiz.options ?? [];
  const uniqueLabels = new Set(options.map((option) => normalizeLabel(option.label)));

  if (options.length < 4) {
    addFinding(
      "warn",
      "quiz.too-few-options",
      `${origin} 仅有 ${options.length} 个选项，干扰项不足。`
    );
  }

  if (uniqueLabels.size < options.length) {
    addFinding(
      "warn",
      "quiz.duplicate-options",
      `${origin} 存在重复选项标签，干扰项质量偏低。`
    );
  }
}

function checkQuizQuality() {
  for (let index = 0; index < words.length; index += 1) {
    inspectChoiceDistractors(getVocabularyQuiz(index), `word:${words[index].id}`);
  }

  for (let index = 0; index < sentences.length; index += 1) {
    inspectChoiceDistractors(getSentenceQuiz(index), `sentence:${sentences[index].id}`);
  }

  for (const passage of passages) {
    for (const question of passage.questions) {
      inspectChoiceDistractors(question, `reading:${passage.id}:${question.id}`);
    }
  }
}

function printFindings() {
  if (findings.length === 0) {
    console.log("content quality check passed with no findings.");
    return;
  }

  for (const finding of findings) {
    console.log(`[${finding.severity}] ${finding.code}: ${finding.message}`);
  }

  const summary = findings.reduce(
    (acc, finding) => {
      acc[finding.severity] += 1;
      return acc;
    },
    { error: 0, warn: 0 }
  );

  console.log(`summary: ${summary.error} error(s), ${summary.warn} warning(s)`);
}

checkReadingLocalization();
checkExpressions();
checkQuizQuality();
printFindings();

if (findings.some((finding) => finding.severity === "error")) {
  process.exitCode = 1;
}
