import { expressions, passages, releaseWordIds, releaseWords, sentences, words as allWords } from "@/lib/content";
import {
  canGenerateExpressionQuiz,
  getExpressionQuiz,
  getSentenceQuiz,
  getVocabularyQuiz
} from "@/data/quizzes";
import type { QuizItem } from "@/types/content";
import { analyzeWordsForRelease } from "./content-release-policy";

type Severity = "error" | "warn";

interface Finding {
  severity: Severity;
  code: string;
  message: string;
}

const findings: Finding[] = [];
const releaseAudit = analyzeWordsForRelease(allWords);

function addFinding(severity: Severity, code: string, message: string) {
  findings.push({ severity, code, message });
}

function normalizeLabel(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function inspectChoiceDistractors(quiz: QuizItem, origin: string) {
  if (quiz.type !== "single-choice") {
    return;
  }

  const options = quiz.options ?? [];
  const uniqueLabels = new Set(options.map((option) => normalizeLabel(option.label)));

  if (options.length < 4) {
    addFinding("warn", "quiz.too-few-options", `${origin} 仅有 ${options.length} 个选项，干扰项偏少。`);
  }

  if (uniqueLabels.size < options.length) {
    addFinding("warn", "quiz.duplicate-options", `${origin} 存在重复选项标签，干扰项质量偏低。`);
  }
}

function checkReleaseWhitelistFreshness() {
  const expectedIds = releaseAudit.releaseWords.map((word) => word.id);
  const releaseIdMismatch =
    expectedIds.length !== releaseWordIds.length ||
    expectedIds.some((wordId, index) => releaseWordIds[index] !== wordId);

  if (releaseIdMismatch) {
    addFinding("warn", "release.whitelist-outdated", "release-word-ids.json 与当前审计结果不一致，请重新生成发布白名单。");
  }
}

function checkReleaseAuditIntegrity() {
  if (releaseWords.length === 0) {
    addFinding("error", "release.empty", "发布白名单为空，主学习链路无法生成正式词库。");
  }

  if (releaseAudit.releaseWords.length !== releaseWords.length) {
    addFinding(
      "error",
      "release.mismatched-count",
      `运行时发布词库数量为 ${releaseWords.length}，审计结果为 ${releaseAudit.releaseWords.length}，请重新同步白名单。`
    );
  }

  if (releaseAudit.reasonCounts["repeated-example-pattern"] > 0) {
    addFinding(
      "warn",
      "release.pattern-pruned",
      `已有 ${releaseAudit.reasonCounts["repeated-example-pattern"]} 个词条因例句模板超阈值被降级为仅词库保留。`
    );
  }

  if (releaseAudit.reasonCounts["duplicate-example-translation"] > 0) {
    addFinding(
      "warn",
      "release.translation-pruned",
      `已有 ${releaseAudit.reasonCounts["duplicate-example-translation"]} 个词条因例句中文重复被降级为仅词库保留。`
    );
  }

  if (releaseAudit.libraryOnlyWords.length > 0) {
    addFinding(
      "warn",
      "release.library-only-retained",
      `当前共有 ${releaseAudit.libraryOnlyWords.length} 个词条保留在词库检索中，但不会进入正式学习流。`
    );
  }
}

function checkReadingLocalization() {
  for (const passage of passages) {
    for (const question of passage.questions) {
      if (question.type !== "reading-question") {
        continue;
      }

      if (!question.questionId?.trim()) {
        addFinding("error", "reading.missing-question-id", `${passage.id}/${question.id} 缺少稳定 questionId。`);
      }

      if (!question.promptZh?.trim()) {
        addFinding("error", "reading.missing-prompt-zh", `${passage.id}/${question.id} 缺少中文题干 promptZh。`);
      }

      if (question.meta?.mode === "true-false" && !question.promptSupplementZh?.trim()) {
        addFinding(
          "error",
          "reading.missing-true-false-translation",
          `${passage.id}/${question.id} 缺少判断题中文补充说明 promptSupplementZh。`
        );
      }

      for (const option of question.options ?? []) {
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
    addFinding("warn", "expression.disabled", `expression 数据仅 ${expressions.length} 条，小于 8 条时应禁用该题型。`);
    return;
  }

  if (!canGenerateExpressionQuiz()) {
    addFinding("error", "expression.generator-disabled", "expression 数据已达到阈值，但题型生成器仍返回禁用。");
  }

  for (let index = 0; index < expressions.length; index += 1) {
    inspectChoiceDistractors(getExpressionQuiz(index), `expression:${expressions[index].id}`);
  }
}

function checkQuizQuality() {
  for (let index = 0; index < releaseWords.length; index += 1) {
    inspectChoiceDistractors(getVocabularyQuiz(index), `word:${releaseWords[index].id}`);
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

checkReleaseWhitelistFreshness();
checkReleaseAuditIntegrity();
checkReadingLocalization();
checkExpressions();
checkQuizQuality();
printFindings();

if (findings.some((finding) => finding.severity === "error")) {
  process.exitCode = 1;
}
