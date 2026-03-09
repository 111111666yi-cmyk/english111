import fs from "node:fs";
import path from "node:path";

type Collection = "words" | "sentences" | "passages" | "expressions";

interface ManifestEntry {
  collection: Collection;
  id: string;
  source: string;
  keyword?: string;
  paragraphIndex?: number;
  variant?: "basic" | "advanced";
}

interface ManifestFile {
  files: ManifestEntry[];
}

interface WordEntry {
  id: string;
  word: string;
}

interface SentenceEntry {
  id: string;
  keywords: string[];
}

interface PassageEntry {
  id: string;
}

interface ExpressionEntry {
  id: string;
}

const root = process.cwd();
const args = process.argv.slice(2);

function getArgValue(flag: string, fallback: string) {
  const index = args.findIndex((item) => item === flag);
  return index >= 0 ? args[index + 1] : fallback;
}

const sourceDir = path.resolve(root, getArgValue("--source-dir", "audio-import"));
const outputPath = path.resolve(root, getArgValue("--output", "scripts/audio-manifest.generated.json"));

function readJson<T>(relativePath: string) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8").replace(/^\uFEFF/, "")) as T;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function listFiles(relativeFolder: string) {
  const folder = path.join(sourceDir, relativeFolder);
  if (!fs.existsSync(folder)) {
    return [] as string[];
  }

  return fs
    .readdirSync(folder)
    .filter((entry) => fs.statSync(path.join(folder, entry)).isFile())
    .map((entry) => path.join(folder, entry));
}

const words = readJson<WordEntry[]>("src/data/words.json");
const sentences = readJson<SentenceEntry[]>("src/data/sentences.json");
const passages = readJson<PassageEntry[]>("src/data/passages.json");
const expressions = readJson<ExpressionEntry[]>("src/data/expressions.json");

const manifest: ManifestFile = { files: [] };

for (const file of listFiles("words")) {
  const parsed = path.parse(file);
  const normalized = slugify(parsed.name);
  const word = words.find((entry) => slugify(entry.word) === normalized || entry.id === parsed.name);
  if (word) {
    manifest.files.push({
      collection: "words",
      id: word.id,
      source: file
    });
  }
}

for (const file of listFiles("sentences")) {
  const parsed = path.parse(file);
  const sentenceParagraphMatch = parsed.name.match(/^(sentence-[a-z0-9-]+)$/i);
  const keywordMatch = parsed.name.match(/^(sentence-[a-z0-9-]+)--keyword--([a-z0-9-]+)$/i);

  if (keywordMatch) {
    const [, sentenceId, keywordSlug] = keywordMatch;
    const sentence = sentences.find((entry) => entry.id === sentenceId);
    const keyword = sentence?.keywords.find((item) => slugify(item) === keywordSlug);
    if (sentence && keyword) {
      manifest.files.push({
        collection: "sentences",
        id: sentence.id,
        keyword,
        source: file
      });
    }
    continue;
  }

  if (sentenceParagraphMatch) {
    const sentence = sentences.find((entry) => entry.id === parsed.name);
    if (sentence) {
      manifest.files.push({
        collection: "sentences",
        id: sentence.id,
        source: file
      });
    }
  }
}

for (const file of listFiles("passages")) {
  const parsed = path.parse(file);
  const paragraphMatch = parsed.name.match(/^(passage-[a-z0-9-]+)-p(\d+)$/i);

  if (paragraphMatch) {
    const [, passageId, paragraphIndexRaw] = paragraphMatch;
    const passage = passages.find((entry) => entry.id === passageId);
    if (passage) {
      manifest.files.push({
        collection: "passages",
        id: passage.id,
        paragraphIndex: Number(paragraphIndexRaw),
        source: file
      });
    }
    continue;
  }

  const passage = passages.find((entry) => entry.id === parsed.name);
  if (passage) {
    manifest.files.push({
      collection: "passages",
      id: passage.id,
      source: file
    });
  }
}

for (const file of listFiles("expressions")) {
  const parsed = path.parse(file);
  const match = parsed.name.match(/^(expression-[a-z0-9-]+)-(basic|advanced)$/i);
  if (!match) {
    continue;
  }

  const [, expressionId, variant] = match;
  const expression = expressions.find((entry) => entry.id === expressionId);
  if (expression) {
    manifest.files.push({
      collection: "expressions",
      id: expression.id,
      variant: variant as "basic" | "advanced",
      source: file
    });
  }
}

fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated ${manifest.files.length} manifest entr${manifest.files.length === 1 ? "y" : "ies"} at ${outputPath}`);
