import expressions from "../src/data/expressions.json";
import passages from "../src/data/passages.json";
import sentences from "../src/data/sentences.json";
import words from "../src/data/words.json";

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

for (const word of words) {
  assert(word.id && word.word && word.meaningZh, `Invalid word entry: ${JSON.stringify(word)}`);
}

assert(words.length >= 120, "Word dataset must contain at least 120 entries.");
assert(
  new Set(words.map((word) => word.word.toLowerCase())).size === words.length,
  "Word dataset must not contain duplicate word labels."
);

for (const sentence of sentences) {
  assert(
    sentence.id && sentence.sentenceEn && sentence.sentenceZh,
    `Invalid sentence entry: ${JSON.stringify(sentence)}`
  );
  assert(sentence.reorderAnswer, `Sentence ${sentence.id} must provide reorderAnswer.`);
  assert(sentence.jumbled?.length > 0, `Sentence ${sentence.id} must provide jumbled tokens.`);
}

assert(sentences.length >= 120, "Sentence dataset must contain at least 120 entries.");
assert(
  new Set(sentences.map((sentence) => sentence.id)).size === sentences.length,
  "Sentence dataset must not contain duplicate ids."
);

for (const expression of expressions) {
  assert(
    expression.id && expression.basic && expression.advanced,
    `Invalid expression entry: ${JSON.stringify(expression)}`
  );
}

for (const passage of passages) {
  assert(
    passage.contentEn.length === passage.contentZh.length,
    `Passage ${passage.id} has mismatched EN/ZH paragraphs.`
  );
  assert(passage.questions.length > 0, `Passage ${passage.id} must contain questions.`);
  for (const question of passage.questions) {
    assert(question.sourceRef, `Question ${question.id} must provide sourceRef.`);
  }
}

assert(passages.length >= 24, "Passage dataset must contain at least 24 entries.");
assert(
  new Set(passages.map((passage) => passage.id)).size === passages.length,
  "Passage dataset must not contain duplicate ids."
);

console.log("Content validation passed.");
