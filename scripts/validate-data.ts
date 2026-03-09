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

for (const sentence of sentences) {
  assert(
    sentence.id && sentence.sentenceEn && sentence.sentenceZh,
    `Invalid sentence entry: ${JSON.stringify(sentence)}`
  );
}

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

console.log("Content validation passed.");
