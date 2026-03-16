import fs from "node:fs";
import path from "node:path";
import expressions from "../src/data/expressions.json";
import passages from "../src/data/passages.json";
import sentences from "../src/data/sentences.json";
import words from "../src/data/words.json";
import type { ExpressionEntry, PassageEntry, SentenceEntry, WordEntry } from "../src/types/content";

const root = process.cwd();
const missing: string[] = [];

function checkAudioPath(entryLabel: string, audioPath?: string | null) {
  if (!audioPath) {
    return;
  }

  const normalized = audioPath.startsWith("/") ? audioPath.slice(1) : audioPath;
  const fullPath = path.join(root, "public", normalized.replace(/^public[\\/]/, ""));
  if (!fs.existsSync(fullPath)) {
    missing.push(`${entryLabel}: ${audioPath}`);
  }
}

for (const word of words as WordEntry[]) {
  checkAudioPath(`word:${word.id}`, word.audioLocal);
}

for (const sentence of sentences as SentenceEntry[]) {
  checkAudioPath(`sentence:${sentence.id}`, sentence.audioLocal);
  if (sentence.keywordAudio) {
    for (const [keyword, value] of Object.entries(sentence.keywordAudio)) {
      checkAudioPath(`sentence:${sentence.id}:keyword:${keyword}`, value);
    }
  }
}

for (const passage of passages as PassageEntry[]) {
  checkAudioPath(`passage:${passage.id}`, passage.audioLocal);
  for (const [index, paragraphAudio] of (passage.paragraphAudio ?? []).entries()) {
    checkAudioPath(`passage:${passage.id}:paragraph:${index + 1}`, paragraphAudio);
  }
}

for (const expression of expressions as ExpressionEntry[]) {
  checkAudioPath(`expression:${expression.id}:basic`, expression.audioLocalBasic);
  checkAudioPath(`expression:${expression.id}:advanced`, expression.audioLocalAdvanced);
}

if (missing.length) {
  console.error("Missing audio files:");
  for (const item of missing) {
    console.error(`- ${item}`);
  }
  process.exit(1);
}

console.log("Audio validation passed.");
