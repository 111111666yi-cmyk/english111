import fs from "node:fs";
import path from "node:path";
import expressions from "../src/data/expressions.json";
import passages from "../src/data/passages.json";
import sentences from "../src/data/sentences.json";
import words from "../src/data/words.json";
import releaseWordIds from "../src/data/release-word-ids.json";
import { ambientTrackMeta } from "../src/lib/ambient-track-catalog";
import type { ExpressionEntry, PassageEntry, SentenceEntry, WordEntry } from "../src/types/content";

const root = process.cwd();
const publicAudioRoot = path.join(root, "public", "audio");
const androidAudioRoot = path.join(root, "android", "app", "src", "main", "assets", "public", "audio");
const reportDir = path.join(root, "reports");
const reportPath = path.join(reportDir, "audio-orphans.json");

const uiAudioFiles = [
  "/audio/ui/mechanical-keyboard.mp3",
  "/audio/ui/cat-paw.mp3",
  "/audio/ui/christmas-bells.mp3",
  "/audio/ui/fireworks.mp3"
];

function normalizeAudioPath(audioPath: string) {
  return audioPath.startsWith("/") ? audioPath.replace(/\\/g, "/") : `/${audioPath.replace(/\\/g, "/")}`;
}

function addAudioPath(target: Set<string>, audioPath?: string | null) {
  if (!audioPath || audioPath.startsWith("speech:")) {
    return;
  }

  target.add(normalizeAudioPath(audioPath));
}

function walkAudioFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [] as string[];
  }

  return fs.readdirSync(dirPath, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      return walkAudioFiles(fullPath);
    }

    return /\.(mp3|m4a|wav|ogg)$/i.test(entry.name) ? [fullPath] : [];
  });
}

function toPublicRelative(fullPath: string, baseDir: string) {
  return `/${path.relative(baseDir, fullPath).replace(/\\/g, "/")}`;
}

const releaseWordIdSet = new Set(releaseWordIds);
const wordEntries = words as unknown as WordEntry[];
const sentenceEntries = sentences as unknown as SentenceEntry[];
const passageEntries = passages as unknown as PassageEntry[];
const expressionEntries = expressions as unknown as ExpressionEntry[];
const releaseWords = wordEntries.filter((word) => releaseWordIdSet.has(word.id));
const libraryOnlyWords = wordEntries.filter((word) => !releaseWordIdSet.has(word.id));

const retainedAudioPaths = new Set<string>();
const releaseWordAudioPaths = new Set<string>();
const libraryOnlyWordAudioPaths = new Set<string>();
const sentenceAudioPaths = new Set<string>();
const passageAudioPaths = new Set<string>();
const expressionAudioPaths = new Set<string>();
const ambientAudioPaths = new Set<string>();
const uiAudioPathSet = new Set<string>();

for (const word of releaseWords) {
  addAudioPath(retainedAudioPaths, word.audioLocal);
  addAudioPath(retainedAudioPaths, word.exampleAudioLocal);
  addAudioPath(releaseWordAudioPaths, word.audioLocal);
  addAudioPath(releaseWordAudioPaths, word.exampleAudioLocal);
}

for (const word of libraryOnlyWords) {
  addAudioPath(retainedAudioPaths, word.audioLocal);
  addAudioPath(retainedAudioPaths, word.exampleAudioLocal);
  addAudioPath(libraryOnlyWordAudioPaths, word.audioLocal);
  addAudioPath(libraryOnlyWordAudioPaths, word.exampleAudioLocal);
}

for (const sentence of sentenceEntries) {
  addAudioPath(retainedAudioPaths, sentence.audioLocal);
  addAudioPath(sentenceAudioPaths, sentence.audioLocal);
  Object.values(sentence.keywordAudio ?? {}).forEach((audioPath) => {
    addAudioPath(retainedAudioPaths, audioPath);
    addAudioPath(sentenceAudioPaths, audioPath);
  });
}

for (const passage of passageEntries) {
  addAudioPath(retainedAudioPaths, passage.audioLocal);
  addAudioPath(passageAudioPaths, passage.audioLocal);
  (passage.paragraphAudio ?? []).forEach((audioPath) => {
    addAudioPath(retainedAudioPaths, audioPath);
    addAudioPath(passageAudioPaths, audioPath);
  });
}

for (const expression of expressionEntries) {
  addAudioPath(retainedAudioPaths, expression.audioLocalBasic);
  addAudioPath(retainedAudioPaths, expression.audioLocalAdvanced);
  addAudioPath(expressionAudioPaths, expression.audioLocalBasic);
  addAudioPath(expressionAudioPaths, expression.audioLocalAdvanced);
}

Object.values(ambientTrackMeta).forEach((track) => {
  addAudioPath(retainedAudioPaths, track.path);
  addAudioPath(ambientAudioPaths, track.path);
});
uiAudioFiles.forEach((audioPath) => {
  addAudioPath(retainedAudioPaths, audioPath);
  addAudioPath(uiAudioPathSet, audioPath);
});

const publicFiles = walkAudioFiles(publicAudioRoot).map((filePath) => toPublicRelative(filePath, path.join(root, "public")));
const androidFiles = walkAudioFiles(androidAudioRoot).map((filePath) => toPublicRelative(filePath, path.join(root, "android", "app", "src", "main", "assets", "public")));
const publicFileSet = new Set(publicFiles);
const androidFileSet = new Set(androidFiles);

const orphanFiles = publicFiles.filter((audioPath) => !retainedAudioPaths.has(audioPath));
const missingRetainedFiles = Array.from(retainedAudioPaths).filter((audioPath) => !publicFileSet.has(audioPath));
const androidMissingFiles = Array.from(retainedAudioPaths).filter((audioPath) => !androidFileSet.has(audioPath));
const androidExtraFiles = androidFiles.filter((audioPath) => !retainedAudioPaths.has(audioPath));

const lowerCaseBuckets = new Map<string, Set<string>>();
for (const audioPath of publicFiles) {
  const key = audioPath.toLowerCase();
  const current = lowerCaseBuckets.get(key) ?? new Set<string>();
  current.add(audioPath);
  lowerCaseBuckets.set(key, current);
}

const caseConflicts = Array.from(lowerCaseBuckets.values())
  .filter((bucket) => bucket.size > 1)
  .map((bucket) => Array.from(bucket).sort());

const baseNameBuckets = new Map<string, Set<string>>();
for (const audioPath of publicFiles) {
  const baseName = path.basename(audioPath).toLowerCase();
  const current = baseNameBuckets.get(baseName) ?? new Set<string>();
  current.add(audioPath);
  baseNameBuckets.set(baseName, current);
}

const baseNameOverlaps = Array.from(baseNameBuckets.entries())
  .filter(([, bucket]) => bucket.size > 1)
  .map(([baseName, bucket]) => ({
    baseName,
    paths: Array.from(bucket).sort()
  }));

const report = {
  generatedAt: new Date().toISOString(),
  totals: {
    retainedReferences: retainedAudioPaths.size,
    publicAudioFiles: publicFiles.length,
    androidAudioFiles: androidFiles.length,
    orphanFiles: orphanFiles.length,
    missingRetainedFiles: missingRetainedFiles.length,
    androidMissingFiles: androidMissingFiles.length,
    androidExtraFiles: androidExtraFiles.length,
    caseConflicts: caseConflicts.length,
    baseNameOverlaps: baseNameOverlaps.length
  },
  retainedBreakdown: {
    releaseWordAudio: releaseWordAudioPaths.size,
    libraryOnlyWordAudio: libraryOnlyWordAudioPaths.size,
    sentenceAudio: sentenceAudioPaths.size,
    passageAudio: passageAudioPaths.size,
    expressionAudio: expressionAudioPaths.size,
    ambientAudio: ambientAudioPaths.size,
    uiAudio: uiAudioPathSet.size
  },
  samples: {
    orphanFiles: orphanFiles.slice(0, 50),
    missingRetainedFiles: missingRetainedFiles.slice(0, 50),
    androidMissingFiles: androidMissingFiles.slice(0, 50),
    androidExtraFiles: androidExtraFiles.slice(0, 50),
    caseConflicts: caseConflicts.slice(0, 20),
    baseNameOverlaps: baseNameOverlaps.slice(0, 20)
  }
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(`Audio orphan report written to ${reportPath}`);
console.log(JSON.stringify(report.totals, null, 2));

if (
  orphanFiles.length > 0 ||
  missingRetainedFiles.length > 0 ||
  caseConflicts.length > 0 ||
  androidExtraFiles.length > 0
) {
  process.exitCode = 1;
}
