import fs from "node:fs";
import path from "node:path";
import expressions from "../src/data/expressions.json";
import passages from "../src/data/passages.json";
import sentences from "../src/data/sentences.json";
import words from "../src/data/words.json";

const outputDir = path.join(process.cwd(), "public", "data");
fs.mkdirSync(outputDir, { recursive: true });

fs.writeFileSync(path.join(outputDir, "words.json"), JSON.stringify(words, null, 2));
fs.writeFileSync(path.join(outputDir, "sentences.json"), JSON.stringify(sentences, null, 2));
fs.writeFileSync(path.join(outputDir, "passages.json"), JSON.stringify(passages, null, 2));
fs.writeFileSync(path.join(outputDir, "expressions.json"), JSON.stringify(expressions, null, 2));

console.log(`Static content copied to ${outputDir}`);
