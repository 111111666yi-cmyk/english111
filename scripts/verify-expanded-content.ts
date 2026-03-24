import fs from "node:fs";
import path from "node:path";

export interface ExpandedWordEntry {
  id: string;
  level: string;
  sentence: string;
  chinese: string;
  word?: string;
}

export interface ExpandedContentFailure {
  id: string;
  reason: string;
}

export interface ExpandedContentVerificationResult {
  success: boolean;
  stats: {
    total: number;
    passed: number;
    failed: number;
    threshold: number;
    uniquePatterns: number;
  };
  details: ExpandedContentFailure[];
}

const DEFAULT_TEMPLATE_RED_LINE = 5;

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function buildSentencePattern(sentence: string, word?: string) {
  const normalized = normalizeWhitespace(sentence)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return "";
  }

  if (!word?.trim()) {
    return normalized.split(" ").slice(0, 6).join(" ");
  }

  const normalizedWord = word.trim().toLowerCase();
  return normalized
    .replace(new RegExp(`\\b${escapeRegExp(normalizedWord)}\\b`, "g"), "__target__")
    .split(" ")
    .slice(0, 6)
    .join(" ");
}

export function verifyNewSentences(
  newEntries: ExpandedWordEntry[],
  options?: { templateRedLine?: number }
): ExpandedContentVerificationResult {
  const templateRedLine = options?.templateRedLine ?? DEFAULT_TEMPLATE_RED_LINE;
  const sentenceStats = new Map<string, number>();
  const passList: string[] = [];
  const failList: ExpandedContentFailure[] = [];

  for (const entry of newEntries) {
    if (!entry.sentence?.trim() || !entry.chinese?.trim()) {
      failList.push({ id: entry.id, reason: "Missing sentence or chinese translation" });
      continue;
    }

    const pattern = buildSentencePattern(entry.sentence, entry.word);
    if (!pattern) {
      failList.push({ id: entry.id, reason: "Unable to derive sentence pattern" });
      continue;
    }

    const nextCount = (sentenceStats.get(pattern) ?? 0) + 1;
    sentenceStats.set(pattern, nextCount);

    if (nextCount > templateRedLine) {
      failList.push({
        id: entry.id,
        reason: `Pattern "${pattern}" exceeded threshold ${templateRedLine}`
      });
      continue;
    }

    passList.push(entry.id);
  }

  return {
    success: failList.length === 0,
    stats: {
      total: newEntries.length,
      passed: passList.length,
      failed: failList.length,
      threshold: templateRedLine,
      uniquePatterns: sentenceStats.size
    },
    details: failList
  };
}

function printUsage() {
  console.log(
    [
      "Usage: npm run content:verify:expanded -- --input <json-file> [--threshold 5] [--report reports/expanded-content-check.json]",
      "Input format: an array of entries or an object with an `entries` array.",
      "Each entry should include: id, level, sentence, chinese, and optional word."
    ].join("\n")
  );
}

function getArgValue(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) {
    return undefined;
  }

  return process.argv[index + 1];
}

function loadEntries(inputPath: string) {
  const resolvedPath = path.resolve(process.cwd(), inputPath);
  const raw = fs.readFileSync(resolvedPath, "utf8");
  const parsed = JSON.parse(raw) as ExpandedWordEntry[] | { entries: ExpandedWordEntry[] };

  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (Array.isArray(parsed.entries)) {
    return parsed.entries;
  }

  throw new Error("Input JSON must be an array or an object containing an `entries` array.");
}

function maybeWriteReport(reportPath: string | undefined, result: ExpandedContentVerificationResult) {
  if (!reportPath) {
    return;
  }

  const resolvedPath = path.resolve(process.cwd(), reportPath);
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  fs.writeFileSync(resolvedPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(`Expanded content report written to ${resolvedPath}`);
}

if (require.main === module) {
  const inputPath = getArgValue("--input");
  const thresholdValue = getArgValue("--threshold");
  const reportPath = getArgValue("--report");
  const helpRequested = process.argv.includes("--help");

  if (helpRequested) {
    printUsage();
    process.exitCode = 0;
  } else if (!inputPath) {
    printUsage();
    process.exitCode = 1;
  } else {
    const threshold = thresholdValue ? Number(thresholdValue) : DEFAULT_TEMPLATE_RED_LINE;

    if (!Number.isFinite(threshold) || threshold < 1) {
      throw new Error("`--threshold` must be a positive number.");
    }

    const entries = loadEntries(inputPath);
    const result = verifyNewSentences(entries, { templateRedLine: threshold });

    maybeWriteReport(reportPath, result);
    console.log(JSON.stringify(result, null, 2));

    if (!result.success) {
      process.exitCode = 1;
    }
  }
}
