import expressions from "../src/data/expressions.json";
import passages from "../src/data/passages.json";
import sentences from "../src/data/sentences.json";
import words from "../src/data/words.json";

export interface ValidationThresholds {
  minWords: number;
  minSentences: number;
  minPassages: number;
  requireReadingQuestionLocalization?: boolean;
}

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

export function validateContentData(thresholds: ValidationThresholds) {
  for (const word of words) {
    assert(word.id && word.word && word.meaningZh, `Invalid word entry: ${JSON.stringify(word)}`);
  }

  assert(
    words.length >= thresholds.minWords,
    `Word dataset must contain at least ${thresholds.minWords} entries.`
  );
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

  assert(
    sentences.length >= thresholds.minSentences,
    `Sentence dataset must contain at least ${thresholds.minSentences} entries.`
  );
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

      if (thresholds.requireReadingQuestionLocalization && question.type === "reading-question") {
        assert(question.questionId, `Reading question ${question.id} must provide questionId.`);
        assert(question.promptZh, `Reading question ${question.id} must provide promptZh.`);
        assert(question.answerText, `Reading question ${question.id} must provide answerText.`);

        if (question.meta?.mode === "true-false") {
          assert(
            question.promptSupplementZh,
            `True/false reading question ${question.id} must provide promptSupplementZh.`
          );
        }

        if (question.options?.length) {
          for (const option of question.options) {
            assert(
              option.translationZh,
              `Reading question ${question.id} option ${option.id} must provide translationZh.`
            );
          }
        }
      }
    }
  }

  assert(
    passages.length >= thresholds.minPassages,
    `Passage dataset must contain at least ${thresholds.minPassages} entries.`
  );
  assert(
    new Set(passages.map((passage) => passage.id)).size === passages.length,
    "Passage dataset must not contain duplicate ids."
  );
}
