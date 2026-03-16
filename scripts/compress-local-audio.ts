import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const ffmpegPath = require("ffmpeg-static") as string | null;

if (!ffmpegPath) {
  throw new Error("ffmpeg-static binary not found.");
}

const resolvedFfmpegPath = ffmpegPath;

const projectRoot = process.cwd();
const audioRoots = [
  path.join(projectRoot, "public", "audio", "words"),
  path.join(projectRoot, "public", "audio", "sentences"),
  path.join(projectRoot, "public", "audio", "passages"),
  path.join(projectRoot, "public", "audio", "expressions")
] as const;

const dataFiles = [
  path.join(projectRoot, "src", "data", "words.json"),
  path.join(projectRoot, "src", "data", "sentences.json"),
  path.join(projectRoot, "src", "data", "passages.json"),
  path.join(projectRoot, "src", "data", "expressions.json"),
  path.join(projectRoot, "public", "data", "words.json"),
  path.join(projectRoot, "public", "data", "sentences.json"),
  path.join(projectRoot, "public", "data", "passages.json"),
  path.join(projectRoot, "public", "data", "expressions.json")
] as const;

const concurrency = Math.max(2, Math.min(os.cpus().length, 6));

function listWavFiles(dir: string) {
  const stack = [dir];
  const files: string[] = [];

  while (stack.length) {
    const current = stack.pop();
    if (!current || !fs.existsSync(current)) {
      continue;
    }

    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile() && fullPath.toLowerCase().endsWith(".wav")) {
        files.push(fullPath);
      }
    }
  }

  return files.sort();
}

function convertFile(inputPath: string) {
  const outputPath = inputPath.replace(/\.wav$/i, ".mp3");

  return new Promise<void>((resolve, reject) => {
    const child = spawn(
      resolvedFfmpegPath,
      [
        "-y",
        "-i",
        inputPath,
        "-vn",
        "-map_metadata",
        "-1",
        "-ac",
        "1",
        "-ar",
        "22050",
        "-codec:a",
        "libmp3lame",
        "-b:a",
        "32k",
        outputPath
      ],
      {
        stdio: "ignore"
      }
    );

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`ffmpeg exited with code ${code} for ${inputPath}`));
        return;
      }

      fs.unlinkSync(inputPath);
      resolve();
    });
  });
}

async function runQueue(files: string[]) {
  let cursor = 0;
  let completed = 0;

  const workers = Array.from({ length: concurrency }, async () => {
    while (cursor < files.length) {
      const index = cursor++;
      const file = files[index];
      await convertFile(file);
      completed += 1;
      if (completed % 200 === 0 || completed === files.length) {
        console.log(`Converted ${completed}/${files.length}`);
      }
    }
  });

  await Promise.all(workers);
}

function replaceRefs(filePath: string) {
  const content = fs.readFileSync(filePath, "utf8");
  const next = content.replace(/\/audio\/(words|sentences|passages|expressions)\/([^"\s]+?)\.wav/g, "/audio/$1/$2.mp3");

  if (next !== content) {
    fs.writeFileSync(filePath, next);
  }
}

async function main() {
  const wavFiles = audioRoots.flatMap((dir) => listWavFiles(dir));
  if (!wavFiles.length) {
    console.log("No wav files found.");
    return;
  }

  console.log(`Converting ${wavFiles.length} wav files to mp3 with concurrency ${concurrency}.`);
  await runQueue(wavFiles);

  for (const filePath of dataFiles) {
    replaceRefs(filePath);
  }

  console.log("Audio conversion complete.");
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
