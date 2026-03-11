import fs from "node:fs";
import path from "node:path";
import expressions from "../src/data/expressions.json";
import passages from "../src/data/passages.json";
import sentences from "../src/data/sentences.json";
import { createContentSummary } from "./content-summary";
import { localizePassages } from "./reading-question-localization";
import type {
  ExpressionEntry,
  PassageEntry,
  SentenceEntry,
  WordEntry
} from "../src/types/content";
import words from "../src/data/words.json";

const outputDir = path.join(process.cwd(), "public", "data");
const srcPassagesPath = path.join(process.cwd(), "src", "data", "passages.json");
const srcSummaryPath = path.join(process.cwd(), "src", "data", "content-summary.json");
fs.mkdirSync(outputDir, { recursive: true });

const localizedPassages = localizePassages(passages as PassageEntry[]);

fs.writeFileSync(path.join(outputDir, "words.json"), JSON.stringify(words, null, 2));
fs.writeFileSync(path.join(outputDir, "sentences.json"), JSON.stringify(sentences, null, 2));
fs.writeFileSync(srcPassagesPath, `${JSON.stringify(localizedPassages, null, 2)}\n`);
fs.writeFileSync(path.join(outputDir, "passages.json"), JSON.stringify(localizedPassages, null, 2));
fs.writeFileSync(path.join(outputDir, "expressions.json"), JSON.stringify(expressions, null, 2));

const summary = createContentSummary(
  words as WordEntry[],
  sentences as SentenceEntry[],
  localizedPassages,
  expressions as ExpressionEntry[]
);

fs.writeFileSync(srcSummaryPath, JSON.stringify(summary, null, 2));
fs.writeFileSync(path.join(outputDir, "content-summary.json"), JSON.stringify(summary, null, 2));

console.log(`Static content copied to ${outputDir}`);
