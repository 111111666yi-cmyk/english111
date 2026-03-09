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

const root = process.cwd();
const args = process.argv.slice(2);
const manifestArgIndex = args.findIndex((item) => item === "--manifest");
const manifestPath =
  manifestArgIndex >= 0 ? args[manifestArgIndex + 1] : "scripts/audio-manifest.example.json";

if (!manifestPath) {
  throw new Error("Missing --manifest path.");
}

const resolvedManifestPath = path.resolve(root, manifestPath);

if (!fs.existsSync(resolvedManifestPath)) {
  throw new Error(`Manifest file not found: ${resolvedManifestPath}`);
}

const manifestRaw = fs.readFileSync(resolvedManifestPath, "utf8").replace(/^\uFEFF/, "");
const manifest = JSON.parse(manifestRaw) as ManifestFile;

function readJson<T>(relativePath: string) {
  return JSON.parse(
    fs.readFileSync(path.join(root, relativePath), "utf8")
  ) as T;
}

function writeJson(relativePath: string, data: unknown) {
  fs.writeFileSync(path.join(root, relativePath), `${JSON.stringify(data, null, 2)}\n`);
}

const words = readJson<any[]>("src/data/words.json");
const sentences = readJson<any[]>("src/data/sentences.json");
const passages = readJson<any[]>("src/data/passages.json");
const expressions = readJson<any[]>("src/data/expressions.json");

for (const file of manifest.files) {
  const sourcePath = path.resolve(file.source);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Audio source not found: ${sourcePath}`);
  }

  const extension = path.extname(sourcePath) || ".mp3";
  const targetFolder = path.join(root, "public", "audio", file.collection);

  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  if (file.collection === "words") {
    const entry = words.find((item) => item.id === file.id);
    if (!entry) {
      throw new Error(`Word entry not found: ${file.id}`);
    }
    const fileName = `${entry.word}${extension}`.replace(/\s+/g, "-").toLowerCase();
    const targetPath = path.join(targetFolder, fileName);
    fs.copyFileSync(sourcePath, targetPath);
    entry.audioLocal = `/audio/words/${fileName}`;
    continue;
  }

  if (file.collection === "sentences") {
    const entry = sentences.find((item) => item.id === file.id);
    if (!entry) {
      throw new Error(`Sentence entry not found: ${file.id}`);
    }

    if (file.keyword) {
      const fileName = `${file.keyword}${extension}`.replace(/\s+/g, "-").toLowerCase();
      const targetPath = path.join(root, "public", "audio", "words", fileName);
      fs.copyFileSync(sourcePath, targetPath);
      entry.keywordAudio = {
        ...(entry.keywordAudio ?? {}),
        [file.keyword]: `/audio/words/${fileName}`
      };
      continue;
    }

    const fileName = `${entry.id}${extension}`.replace(/\s+/g, "-").toLowerCase();
    const targetPath = path.join(targetFolder, fileName);
    fs.copyFileSync(sourcePath, targetPath);
    entry.audioLocal = `/audio/sentences/${fileName}`;
    continue;
  }

  if (file.collection === "passages") {
    const entry = passages.find((item) => item.id === file.id);
    if (!entry) {
      throw new Error(`Passage entry not found: ${file.id}`);
    }

    if (typeof file.paragraphIndex === "number") {
      const paragraphSlot = file.paragraphIndex - 1;
      const fileName = `${entry.id}-p${file.paragraphIndex}${extension}`.toLowerCase();
      const targetPath = path.join(targetFolder, fileName);
      fs.copyFileSync(sourcePath, targetPath);
      const currentParagraphAudio = [...(entry.paragraphAudio ?? [])];
      currentParagraphAudio[paragraphSlot] = `/audio/passages/${fileName}`;
      entry.paragraphAudio = currentParagraphAudio;
      continue;
    }

    const fileName = `${entry.id}${extension}`.toLowerCase();
    const targetPath = path.join(targetFolder, fileName);
    fs.copyFileSync(sourcePath, targetPath);
    entry.audioLocal = `/audio/passages/${fileName}`;
    continue;
  }

  if (file.collection === "expressions") {
    const entry = expressions.find((item) => item.id === file.id);
    if (!entry) {
      throw new Error(`Expression entry not found: ${file.id}`);
    }
    if (!file.variant) {
      throw new Error(`Expression variant is required for ${file.id}`);
    }
    const expressionText = file.variant === "basic" ? entry.basic : entry.advanced;
    const fileName = `${expressionText}${extension}`.replace(/\s+/g, "-").toLowerCase();
    const targetPath = path.join(targetFolder, fileName);
    fs.copyFileSync(sourcePath, targetPath);
    if (file.variant === "basic") {
      entry.audioLocalBasic = `/audio/expressions/${fileName}`;
    } else {
      entry.audioLocalAdvanced = `/audio/expressions/${fileName}`;
    }
  }
}

writeJson("src/data/words.json", words);
writeJson("src/data/sentences.json", sentences);
writeJson("src/data/passages.json", passages);
writeJson("src/data/expressions.json", expressions);

console.log(`Imported ${manifest.files.length} audio file(s) from ${resolvedManifestPath}`);
