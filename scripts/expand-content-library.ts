import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import type {
  PassageEntry,
  QuizItem,
  SentenceEntry,
  WordEntry
} from "../src/types/content";

type Level = "L1" | "L2" | "L3" | "L4" | "L5";

interface DictionaryRow {
  word: string;
  phonetic: string;
  translation: string;
  pos: string;
  rank: number;
}

const ROOT = process.cwd();
const CACHE_DIR = path.join(ROOT, "scripts", ".cache");
const COMMON_WORDS_URL =
  "https://raw.githubusercontent.com/first20hours/google-10000-english/master/20k.txt";
const ECDICT_URL = "https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv";

const TOTAL_WORD_TARGET = Number.parseInt(getArgValue("--total-words") ?? "500", 10);
const TOTAL_PASSAGE_TARGET = Number.parseInt(getArgValue("--total-passages") ?? "60", 10);

const stopWords = new Set([
  "the",
  "of",
  "and",
  "to",
  "a",
  "in",
  "for",
  "is",
  "on",
  "that",
  "by",
  "this",
  "with",
  "you",
  "it",
  "not",
  "or",
  "be",
  "are",
  "as",
  "at",
  "your",
  "from",
  "we",
  "they",
  "an",
  "can",
  "will",
  "their",
  "if",
  "but",
  "about",
  "into",
  "than",
  "when",
  "after",
  "before",
  "each",
  "every",
  "only",
  "more",
  "most",
  "very",
  "much",
  "many",
  "some",
  "such",
  "other",
  "same",
  "also",
  "there",
  "these",
  "those",
  "through",
  "because",
  "while",
  "during",
  "without",
  "under",
  "over",
  "again",
  "still",
  "then",
  "just"
]);

const learnerNames = [
  "Mina",
  "Hao",
  "Luna",
  "Ken",
  "Sara",
  "Nora",
  "Yuki",
  "Leo",
  "Amy",
  "Ryan"
];

const passageThemes = [
  { topic: "school", title: "Classroom Reading Notes" },
  { topic: "daily life", title: "A Small Daily Routine" },
  { topic: "hobbies", title: "Learning Through Hobbies" },
  { topic: "technology", title: "A Simple Tech Guide" },
  { topic: "travel", title: "Reading for a Travel Plan" },
  { topic: "health", title: "Healthy Habits and New Words" },
  { topic: "friendship", title: "Friends Share Ideas" },
  { topic: "simple science", title: "Science Corner Journal" }
];

const wordsPath = path.join(ROOT, "src", "data", "words.json");
const sentencesPath = path.join(ROOT, "src", "data", "sentences.json");
const passagesPath = path.join(ROOT, "src", "data", "passages.json");

function getArgValue(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function unique(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

function rotateTokens(tokens: string[], offset: number) {
  if (!tokens.length) {
    return tokens;
  }

  const amount = offset % tokens.length;
  return [...tokens.slice(amount), ...tokens.slice(0, amount)];
}

function readJson<T>(filePath: string) {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function writeJson(filePath: string, data: unknown) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

async function ensureCachedFile(targetPath: string, url: string) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });

  if (fs.existsSync(targetPath)) {
    return targetPath;
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  fs.writeFileSync(targetPath, text, "utf8");
  return targetPath;
}

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (insideQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === "," && !insideQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells;
}

function cleanTranslation(raw: string) {
  const withoutTags = raw
    .replace(/\[[^\]]*]/g, "")
    .replace(/\([^)]+\)/g, "")
    .replace(/\b[a-z]\.\s*/gi, "")
    .replace(/\b(adj|adv|n|v|vt|vi|prep|pron|num|art|conj)\b\.?/gi, "")
    .replace(/[;"'`]/g, "")
    .trim();

  const chunks = withoutTags
    .split(/[\n/；;，,]/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  return chunks[0] ?? raw.trim();
}

function mapPartOfSpeech(raw: string) {
  const lowered = raw.toLowerCase();

  if (lowered.includes("adv")) {
    return "adverb";
  }

  if (lowered.includes("adj") || lowered.includes("a.")) {
    return "adjective";
  }

  if (lowered.includes("verb") || lowered.includes("vt") || lowered.includes("vi") || lowered.includes("v.")) {
    return "verb";
  }

  return "noun";
}

function levelFromRank(rank: number, total: number): Level {
  const ratio = rank / Math.max(total, 1);

  if (ratio < 0.25) {
    return "L1";
  }

  if (ratio < 0.5) {
    return "L2";
  }

  if (ratio < 0.72) {
    return "L3";
  }

  if (ratio < 0.88) {
    return "L4";
  }

  return "L5";
}

function difficultyFromLevel(level: Level) {
  return (
    {
      L1: 1,
      L2: 2,
      L3: 3,
      L4: 4,
      L5: 5
    }[level] ?? 2
  );
}

function maybeAudioLocal(category: "words" | "sentences" | "passages" | "expressions", fileName: string) {
  const absolutePath = path.join(ROOT, "public", "audio", category, fileName);
  return fs.existsSync(absolutePath) ? `/audio/${category}/${fileName}` : undefined;
}

async function loadCommonWordRanks(excludedWords: Set<string>) {
  const commonPath = await ensureCachedFile(path.join(CACHE_DIR, "common-20k.txt"), COMMON_WORDS_URL);
  const lines = fs
    .readFileSync(commonPath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim().toLowerCase())
    .filter((line) => /^[a-z]{3,14}$/.test(line))
    .filter((line) => !stopWords.has(line))
    .filter((line) => !excludedWords.has(line));

  const rankMap = new Map<string, number>();

  for (const [index, word] of lines.entries()) {
    if (!rankMap.has(word)) {
      rankMap.set(word, index);
    }
  }

  return rankMap;
}

async function loadDictionaryRows(rankMap: Map<string, number>, desiredCount: number) {
  const dictionaryPath = await ensureCachedFile(path.join(CACHE_DIR, "ecdict.csv"), ECDICT_URL);
  const rows: DictionaryRow[] = [];
  const stream = fs.createReadStream(dictionaryPath, "utf8");
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let isHeader = true;

  for await (const line of rl) {
    if (isHeader) {
      isHeader = false;
      continue;
    }

    if (!line) {
      continue;
    }

    const cells = splitCsvLine(line);
    const rawWord = cells[0]?.trim().toLowerCase();

    if (!rawWord || !rankMap.has(rawWord) || !/^[a-z]{3,14}$/.test(rawWord)) {
      continue;
    }

    const translation = cleanTranslation(cells[3] ?? "");

    if (!translation || translation.length < 2) {
      continue;
    }

    rows.push({
      word: rawWord,
      phonetic: cells[1]?.trim() ? `/${cells[1].trim()}/` : "",
      translation,
      pos: mapPartOfSpeech(cells[4] ?? ""),
      rank: rankMap.get(rawWord) ?? Number.MAX_SAFE_INTEGER
    });

    if (rows.length >= desiredCount * 2) {
      break;
    }
  }

  rl.close();

  rows.sort((left, right) => left.rank - right.rank);

  return rows.filter((row, index, items) => index === items.findIndex((item) => item.word === row.word));
}

function buildWordExample(word: string, partOfSpeech: string) {
  if (partOfSpeech === "verb") {
    return {
      exampleEn: `Students often ${word} the main idea after reading a short text.`,
      exampleZh: `学生会在读完一段短文后，用这个词来表达“${word}”相关的动作。`,
      focusPhrase: `${word} the main idea after reading`
    };
  }

  if (partOfSpeech === "adjective") {
    return {
      exampleEn: `A ${word} note can make a difficult sentence easier to follow.`,
      exampleZh: `这个例句用 ${word} 来帮助你在阅读中识别描述性词汇。`,
      focusPhrase: `a ${word} note can make`
    };
  }

  if (partOfSpeech === "adverb") {
    return {
      exampleEn: `She studies ${word} and checks the key words again before class.`,
      exampleZh: `这个例句展示了 ${word} 这类副词在学习场景中的基本用法。`,
      focusPhrase: `studies ${word} and checks the key words`
    };
  }

  return {
    exampleEn: `The short passage uses ${word} as one of today's key nouns.`,
    exampleZh: `这个例句帮助你在基础语境中认识 ${word} 这类名词。`,
    focusPhrase: `uses ${word} as one of today's key nouns`
  };
}

function buildAutoWords(rows: DictionaryRow[]) {
  const total = rows.length;

  return rows.map((row, index) => {
    const slug = slugify(row.word);
    const level = levelFromRank(index, total);
    const example = buildWordExample(row.word, row.pos);

    return {
      id: `auto-word-${slug}`,
      word: row.word,
      phonetic: row.phonetic,
      partOfSpeech: row.pos,
      meaningZh: row.translation,
      level,
      tags: ["core", "auto-generated"],
      exampleEn: example.exampleEn,
      exampleZh: example.exampleZh,
      synonyms: [],
      pronunciationText: row.word,
      difficulty: difficultyFromLevel(level),
      audioLocal: maybeAudioLocal("words", `${slug}.wav`)
    } satisfies WordEntry;
  });
}

function buildSentenceEntry(
  id: string,
  sentenceEn: string,
  sentenceZh: string,
  keywords: string[],
  relatedWords: string[],
  missingWord: string,
  difficulty: number,
  explanation: string
) {
  const reorderAnswer = sentenceEn.replace(/[.?!]/g, "").split(",")[0].trim();
  const tokens = reorderAnswer.split(/\s+/).filter(Boolean);

  return {
    id,
    sentenceEn,
    sentenceZh,
    keywords: unique(keywords),
    difficulty,
    grammarPoint: "先看关键词，再根据上下文理解整句。",
    relatedWords: unique(relatedWords),
    missingWord,
    reorderAnswer,
    jumbled: rotateTokens(tokens, Math.max(1, id.length % Math.max(tokens.length, 1))),
    explanation,
    audioLocal: maybeAudioLocal("sentences", `${id}.wav`),
    keywordAudio: Object.fromEntries(
      unique(keywords)
        .map((keyword) => {
          const slug = `${slugify(keyword)}.wav`;
          const localPath = maybeAudioLocal("words", slug);
          return localPath ? [keyword, localPath] : null;
        })
        .filter(Boolean) as Array<[string, string]>
    )
  } satisfies SentenceEntry;
}

function buildAutoSentences(autoWords: WordEntry[]) {
  const sentences: SentenceEntry[] = [];

  for (const [index, word] of autoWords.entries()) {
    sentences.push(
      buildSentenceEntry(
        `auto-sentence-${slugify(word.word)}`,
        word.exampleEn,
        word.exampleZh,
        [word.word],
        [word.word],
        word.word,
        Math.max(1, Math.min(4, word.difficulty)),
        `${word.word} 放进完整句子里时，更容易记住它在真实语境中的位置。`
      )
    );

    if (index % 3 === 0) {
      const extraSentence =
        word.partOfSpeech === "verb"
          ? `In class, we ${word.word} the key clue before choosing an answer.`
          : word.partOfSpeech === "adjective"
            ? `The teacher wrote a ${word.word} example so everyone could follow the idea.`
            : word.partOfSpeech === "adverb"
              ? `He read the paragraph ${word.word} and found the answer more easily.`
              : `The group added the word ${word.word} to this week's review card.`;

      sentences.push(
        buildSentenceEntry(
          `auto-sentence-${slugify(word.word)}-extra`,
          extraSentence,
          `这条补充句继续帮助你把 ${word.word} 放进基础阅读任务里理解。`,
          [word.word],
          [word.word],
          word.word,
          Math.max(1, Math.min(4, word.difficulty)),
          `补充句会让 ${word.word} 不只出现一次，复习时更容易形成记忆。`
        )
      );
    }
  }

  return sentences;
}

function buildAutoPassages(autoWords: WordEntry[], targetCount: number) {
  const passages: PassageEntry[] = [];

  for (let index = 0; index < targetCount; index += 1) {
    const theme = passageThemes[index % passageThemes.length];
    const name = learnerNames[index % learnerNames.length];
    const sliceStart = (index * 5) % Math.max(autoWords.length - 5, 1);
    const chunk = autoWords.slice(sliceStart, sliceStart + 5);

    if (chunk.length < 5) {
      break;
    }

    const [w1, w2, w3, w4, w5] = chunk;
    const passageId = `auto-passage-${String(index + 1).padStart(3, "0")}`;

    const contentEn = [
      `${name} started a weekly reading plan for ${theme.topic}. In the first note, the class focused on ${w1.word}, ${w2.word}, and ${w3.word}. They wrote one short sentence for each word and checked the meaning together.`,
      `During the next step, ${name.toLowerCase()} tried to ${w4.word} the main idea more carefully. When a paragraph felt heavy, the group returned to ${w1.word} and used context to understand the sentence again.`,
      `By the end of the activity, the students could explain the topic with more confidence. Basic words such as ${w2.word} and ${w5.word} became useful tools instead of difficult blocks.`
    ] as [string, string, string];

    const contentZh = [
      `${name} 开始围绕“${theme.topic}”做每周阅读计划。第一份记录里，大家先集中学习 ${w1.word}、${w2.word} 和 ${w3.word}，并为每个词写一句短句来帮助理解。`,
      `进入下一步后，${name} 尝试更仔细地${w4.meaningZh}文章主旨。每当某一段读起来吃力时，小组都会回到 ${w1.word} 这个关键词，再借助上下文重新理解句子。`,
      `活动结束时，同学们已经能更有信心地解释这个主题。像 ${w2.word} 和 ${w5.word} 这样的基础词，不再是障碍，而成了有用的阅读工具。`
    ] as [string, string, string];

    const questions: QuizItem[] = [
      {
        id: `${passageId}-q1`,
        type: "reading-question",
        prompt: "What is the main idea of this passage?",
        promptZh: "这篇短文的主旨是什么？",
        options: [
          { id: "a", label: "A small reading routine helps students turn basic words into useful tools." },
          { id: "b", label: "The class decided to stop reading because every word was too difficult." },
          { id: "c", label: "The writer only cared about long novels and ignored short texts." }
        ],
        answer: "a",
        explanation: "主旨题要抓住“计划、方法、结果”这三块反复出现的信息。",
        relatedWords: [w1.word, w2.word],
        difficulty: 2,
        sourceRef: passageId
      },
      {
        id: `${passageId}-q2`,
        type: "reading-question",
        prompt: "Which detail is mentioned in the passage?",
        promptZh: "文中提到了哪一个细节？",
        options: [
          { id: "a", label: `The class wrote one short sentence for each word.` },
          { id: "b", label: "The students sold their books before class began." },
          { id: "c", label: "The teacher cancelled the plan after one day." }
        ],
        answer: "a",
        explanation: "细节题要回到原文，找出明确出现过的动作或事实。",
        relatedWords: [w3.word, w4.word],
        difficulty: 2,
        sourceRef: passageId
      },
      {
        id: `${passageId}-q3`,
        type: "reading-question",
        prompt: "The students thought basic words were always useless.",
        promptZh: "判断下面这句话是否正确。",
        options: [
          { id: "true", label: "True" },
          { id: "false", label: "False" }
        ],
        answer: "false",
        explanation: "结尾明确说明基础词后来变成了有用的阅读工具，所以题干错误。",
        relatedWords: [w2.word, w5.word],
        difficulty: 2,
        sourceRef: passageId,
        meta: {
          mode: "true-false"
        }
      }
    ];

    passages.push({
      id: passageId,
      title: `${theme.title} ${String(index + 1).padStart(2, "0")}`,
      level: index % 5 === 0 ? "L4" : "L3",
      topic: theme.topic,
      contentEn,
      contentZh,
      keyWords: [w1.word, w2.word, w3.word, w4.word, w5.word],
      estimatedMinutes: 4 + (index % 3),
      questions,
      audioLocal: maybeAudioLocal("passages", `${passageId}.wav`),
      paragraphAudio: contentEn
        .map((_, paragraphIndex) => maybeAudioLocal("passages", `${passageId}-p${paragraphIndex + 1}.wav`))
        .filter((item): item is string => Boolean(item))
    });
  }

  return passages;
}

async function main() {
  const currentWords = readJson<WordEntry[]>(wordsPath);
  const currentSentences = readJson<SentenceEntry[]>(sentencesPath);
  const currentPassages = readJson<PassageEntry[]>(passagesPath);

  const baseWords = currentWords.filter((word) => !word.id.startsWith("auto-word-"));
  const baseSentences = currentSentences.filter((sentence) => !sentence.id.startsWith("auto-sentence-"));
  const basePassages = currentPassages.filter((passage) => !passage.id.startsWith("auto-passage-"));

  const desiredAdditionalWords = Math.max(TOTAL_WORD_TARGET - baseWords.length, 0);
  const existingWordTexts = new Set(baseWords.map((word) => word.word.toLowerCase()));
  const rankMap = await loadCommonWordRanks(existingWordTexts);
  const dictionaryRows = await loadDictionaryRows(rankMap, desiredAdditionalWords + 120);
  const selectedRows = dictionaryRows.slice(0, desiredAdditionalWords);
  const autoWords = buildAutoWords(selectedRows);
  const autoSentences = buildAutoSentences(autoWords);
  const desiredAdditionalPassages = Math.max(TOTAL_PASSAGE_TARGET - basePassages.length, 0);
  const autoPassages = buildAutoPassages(autoWords, desiredAdditionalPassages);

  writeJson(wordsPath, [...baseWords, ...autoWords]);
  writeJson(sentencesPath, [...baseSentences, ...autoSentences]);
  writeJson(passagesPath, [...basePassages, ...autoPassages]);

  console.log(
    `Expanded library to ${baseWords.length + autoWords.length} words, ${baseSentences.length + autoSentences.length} sentences, and ${basePassages.length + autoPassages.length} passages.`
  );
}

void main();
