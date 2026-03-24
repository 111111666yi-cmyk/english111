import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const reportDir = path.join(root, "reports");
const reportPath = path.join(reportDir, "audio-integrity.json");
const releaseWordIds = new Set(readJson("src/data/release-word-ids.json"));

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8").replace(/^\uFEFF/, ""));
}

function existsPublicPath(audioPath) {
  if (!audioPath || typeof audioPath !== "string") {
    return false;
  }

  if (audioPath.startsWith("speech:")) {
    return false;
  }

  const normalized = audioPath.startsWith("/") ? audioPath.slice(1) : audioPath;
  return fs.existsSync(path.join(root, "public", normalized));
}

function summarizeWordAudio(words) {
  const releaseWords = words.filter((word) => releaseWordIds.has(word.id));
  const libraryOnlyWords = words.filter((word) => !releaseWordIds.has(word.id));
  const missingWordAudio = [];
  const missingExampleAudio = [];

  for (const word of words) {
    if (!existsPublicPath(word.audioLocal)) {
      missingWordAudio.push(word.id);
    }

    if (!existsPublicPath(word.exampleAudioLocal)) {
      missingExampleAudio.push(word.id);
    }
  }

  return {
    totals: {
      words: words.length,
      releaseWords: releaseWords.length,
      libraryOnlyWords: libraryOnlyWords.length,
      wordAudioReady: words.length - missingWordAudio.length,
      wordExampleAudioReady: words.length - missingExampleAudio.length,
      wordAudioMissing: missingWordAudio.length,
      wordExampleAudioMissing: missingExampleAudio.length
    },
    samples: {
      wordAudioMissing: missingWordAudio.slice(0, 50),
      wordExampleAudioMissing: missingExampleAudio.slice(0, 50)
    }
  };
}

function summarizeSentenceAudio(sentences) {
  const missingSentenceAudio = [];
  const missingKeywordAudio = [];

  for (const sentence of sentences) {
    if (!existsPublicPath(sentence.audioLocal)) {
      missingSentenceAudio.push(sentence.id);
    }

    for (const keyword of sentence.keywords ?? []) {
      const keywordAudio = sentence.keywordAudio?.[keyword];
      if (!existsPublicPath(keywordAudio)) {
        missingKeywordAudio.push(`${sentence.id}:${keyword}`);
      }
    }
  }

  return {
    totals: {
      sentences: sentences.length,
      sentenceAudioReady: sentences.length - missingSentenceAudio.length,
      sentenceAudioMissing: missingSentenceAudio.length,
      keywordAudioMissing: missingKeywordAudio.length
    },
    samples: {
      sentenceAudioMissing: missingSentenceAudio.slice(0, 50),
      keywordAudioMissing: missingKeywordAudio.slice(0, 50)
    }
  };
}

function summarizePassageAudio(passages) {
  const missingPassageAudio = [];
  const missingParagraphAudio = [];
  const speechMappedPassageAudio = [];
  const speechMappedParagraphAudio = [];

  for (const passage of passages) {
    if (String(passage.audioLocal ?? "").startsWith("speech:")) {
      speechMappedPassageAudio.push(passage.id);
    } else if (!existsPublicPath(passage.audioLocal)) {
      missingPassageAudio.push(passage.id);
    }

    for (const [index, paragraphAudio] of (passage.paragraphAudio ?? []).entries()) {
      if (String(paragraphAudio ?? "").startsWith("speech:")) {
        speechMappedParagraphAudio.push(`${passage.id}:paragraph:${index + 1}`);
      } else if (!existsPublicPath(paragraphAudio)) {
        missingParagraphAudio.push(`${passage.id}:paragraph:${index + 1}`);
      }
    }
  }

  return {
    totals: {
      passages: passages.length,
      passageAudioReady: passages.length - missingPassageAudio.length - speechMappedPassageAudio.length,
      passageAudioMissing: missingPassageAudio.length,
      paragraphAudioMissing: missingParagraphAudio.length,
      passageAudioSpeechMapped: speechMappedPassageAudio.length,
      paragraphAudioSpeechMapped: speechMappedParagraphAudio.length
    },
    samples: {
      passageAudioMissing: missingPassageAudio.slice(0, 50),
      paragraphAudioMissing: missingParagraphAudio.slice(0, 50),
      passageAudioSpeechMapped: speechMappedPassageAudio.slice(0, 50),
      paragraphAudioSpeechMapped: speechMappedParagraphAudio.slice(0, 50)
    }
  };
}

function summarizeExpressionAudio(expressions) {
  const missingBasicAudio = [];
  const missingAdvancedAudio = [];

  for (const expression of expressions) {
    if (!existsPublicPath(expression.audioLocalBasic) && !String(expression.audioLocalBasic ?? "").startsWith("speech:")) {
      missingBasicAudio.push(`${expression.id}:basic`);
    }

    if (!existsPublicPath(expression.audioLocalAdvanced) && !String(expression.audioLocalAdvanced ?? "").startsWith("speech:")) {
      missingAdvancedAudio.push(`${expression.id}:advanced`);
    }
  }

  return {
    totals: {
      expressions: expressions.length,
      expressionBasicAudioMissing: missingBasicAudio.length,
      expressionAdvancedAudioMissing: missingAdvancedAudio.length
    },
    samples: {
      expressionBasicAudioMissing: missingBasicAudio.slice(0, 50),
      expressionAdvancedAudioMissing: missingAdvancedAudio.slice(0, 50)
    }
  };
}

function summarizeUiAndAmbientAudio() {
  const uiAudio = [
    "/audio/ui/mechanical-keyboard.mp3",
    "/audio/ui/cat-paw.mp3",
    "/audio/ui/christmas-bells.mp3",
    "/audio/ui/fireworks.mp3"
  ];
  const ambientAudio = [
    "/audio/ambient/wind-chimes.mp3",
    "/audio/ambient/campfire.mp3",
    "/audio/ambient/ocean-waves.mp3",
    "/audio/ambient/forest-birds.mp3",
    "/audio/ambient/light-rain.mp3",
    "/audio/ambient/storm-thunder.mp3",
    "/audio/piano/canon-in-d-major-piano-only.mp3",
    "/audio/piano/winter-rain.mp3",
    "/audio/piano/on-a-breeze.mp3",
    "/audio/piano/poetic-love-letter.mp3",
    "/audio/piano/annabelles-theme.mp3",
    "/audio/piano/autumn-wind.mp3",
    "/audio/piano/streets-of-valencia.mp3",
    "/audio/ambient/jianghu-romance.mp3",
    "/audio/ambient/rustling-leaves.mp3",
    "/audio/ambient/night-wind.mp3",
    "/audio/ambient/distant-boat-horn.mp3",
    "/audio/ambient/ethereal-tone.mp3",
    "/audio/ambient/night-crickets.mp3",
    "/audio/ambient/white-noise.mp3"
  ];

  const missingUiAudio = uiAudio.filter((item) => !existsPublicPath(item));
  const missingAmbientAudio = ambientAudio.filter((item) => !existsPublicPath(item));

  return {
    totals: {
      uiAudio: uiAudio.length,
      uiAudioReady: uiAudio.length - missingUiAudio.length,
      uiAudioMissing: missingUiAudio.length,
      ambientAudio: ambientAudio.length,
      ambientAudioReady: ambientAudio.length - missingAmbientAudio.length,
      ambientAudioMissing: missingAmbientAudio.length
    },
    samples: {
      uiAudioMissing: missingUiAudio,
      ambientAudioMissing: missingAmbientAudio
    }
  };
}

const words = readJson("src/data/words.json");
const sentences = readJson("src/data/sentences.json");
const passages = readJson("src/data/passages.json");
const expressions = readJson("src/data/expressions.json");

const report = {
  generatedAt: new Date().toISOString(),
  wordAudio: summarizeWordAudio(words),
  sentenceAudio: summarizeSentenceAudio(sentences),
  passageAudio: summarizePassageAudio(passages),
  expressionAudio: summarizeExpressionAudio(expressions),
  experienceAudio: summarizeUiAndAmbientAudio()
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(`Audio integrity report written to ${reportPath}`);
console.log(JSON.stringify(report.wordAudio.totals));
console.log(JSON.stringify(report.sentenceAudio.totals));
console.log(JSON.stringify(report.passageAudio.totals));
console.log(JSON.stringify(report.expressionAudio.totals));
console.log(JSON.stringify(report.experienceAudio.totals));

if (
  report.wordAudio.totals.wordAudioMissing > 0 ||
  report.wordAudio.totals.wordExampleAudioMissing > 0 ||
  report.sentenceAudio.totals.sentenceAudioMissing > 0 ||
  report.sentenceAudio.totals.keywordAudioMissing > 0 ||
  report.passageAudio.totals.passageAudioMissing > 0 ||
  report.passageAudio.totals.paragraphAudioMissing > 0 ||
  report.passageAudio.totals.passageAudioSpeechMapped > 0 ||
  report.passageAudio.totals.paragraphAudioSpeechMapped > 0 ||
  report.expressionAudio.totals.expressionBasicAudioMissing > 0 ||
  report.expressionAudio.totals.expressionAdvancedAudioMissing > 0 ||
  report.experienceAudio.totals.uiAudioMissing > 0 ||
  report.experienceAudio.totals.ambientAudioMissing > 0
) {
  process.exitCode = 1;
}
