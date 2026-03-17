import expressions from "../src/data/expressions.json";
import passages from "../src/data/passages.json";
import sentences from "../src/data/sentences.json";
import words from "../src/data/words.json";
import contentHygiene from "./content-hygiene";

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

const { containsBlockedEnglishWord } = contentHygiene;
const {
  containsBlockedChineseFragment,
  containsEscapedNewlineArtifact,
  containsLowQualityMeaningMarker
} = contentHygiene;

function assertNoBlockedEnglishWord(value: string, label: string) {
  assert(!containsBlockedEnglishWord(value), `${label} contains blocked learner content.`);
}

function assertNoBlockedChineseFragment(value: string, label: string) {
  assert(!containsBlockedChineseFragment(value), `${label} contains blocked learner content.`);
}

function assertNoEscapedNewlineArtifact(value: string, label: string) {
  assert(!containsEscapedNewlineArtifact(value), `${label} contains escaped newline artifacts.`);
}

function assertNoLowQualityMeaning(value: string, label: string) {
  assert(!containsLowQualityMeaningMarker(value), `${label} contains low-quality dictionary markers.`);
}

export function validateContentData(thresholds: ValidationThresholds) {
  for (const word of words) {
    assert(word.id && word.word && word.meaningZh, `Invalid word entry: ${JSON.stringify(word)}`);
    assertNoBlockedEnglishWord(word.word, `Word ${word.id}`);
    assertNoBlockedEnglishWord(word.meaningZh, `Word ${word.id} meaningZh`);
    assertNoBlockedChineseFragment(word.meaningZh, `Word ${word.id} meaningZh`);
    assertNoEscapedNewlineArtifact(word.meaningZh, `Word ${word.id} meaningZh`);
    assertNoLowQualityMeaning(word.meaningZh, `Word ${word.id} meaningZh`);
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
    assertNoBlockedEnglishWord(sentence.sentenceEn, `Sentence ${sentence.id} sentenceEn`);
    assertNoBlockedEnglishWord(sentence.sentenceZh, `Sentence ${sentence.id} sentenceZh`);
    assertNoBlockedChineseFragment(sentence.sentenceZh, `Sentence ${sentence.id} sentenceZh`);
    assertNoEscapedNewlineArtifact(sentence.sentenceZh, `Sentence ${sentence.id} sentenceZh`);
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
    for (const paragraph of passage.contentEn) {
      assertNoBlockedEnglishWord(paragraph, `Passage ${passage.id} contentEn`);
    }

    for (const paragraph of passage.contentZh) {
      assertNoBlockedEnglishWord(paragraph, `Passage ${passage.id} contentZh`);
      assertNoBlockedChineseFragment(paragraph, `Passage ${passage.id} contentZh`);
      assertNoEscapedNewlineArtifact(paragraph, `Passage ${passage.id} contentZh`);
    }

    assert(passage.questions.length > 0, `Passage ${passage.id} must contain questions.`);
    for (const question of passage.questions) {
      assert(question.sourceRef, `Question ${question.id} must provide sourceRef.`);
      assertNoBlockedEnglishWord(question.prompt, `Question ${question.id} prompt`);
      assertNoBlockedEnglishWord(question.explanation, `Question ${question.id} explanation`);

      if (thresholds.requireReadingQuestionLocalization && question.type === "reading-question") {
        assert(question.questionId, `Reading question ${question.id} must provide questionId.`);
        assert(question.promptZh, `Reading question ${question.id} must provide promptZh.`);
        assert(question.answerText, `Reading question ${question.id} must provide answerText.`);
        assertNoBlockedEnglishWord(question.promptZh, `Question ${question.id} promptZh`);
        assertNoBlockedEnglishWord(question.answerText, `Question ${question.id} answerText`);
        assertNoBlockedChineseFragment(question.promptZh, `Question ${question.id} promptZh`);
        assertNoEscapedNewlineArtifact(question.promptZh, `Question ${question.id} promptZh`);

        if (question.meta?.mode === "true-false") {
          if (!question.promptSupplementZh) {
            throw new Error(
              `True/false reading question ${question.id} must provide promptSupplementZh.`
            );
          }

          const promptSupplementZh: string = question.promptSupplementZh;

          assertNoBlockedEnglishWord(
            promptSupplementZh,
            `Question ${question.id} promptSupplementZh`
          );
          assertNoBlockedChineseFragment(
            promptSupplementZh,
            `Question ${question.id} promptSupplementZh`
          );
        }

        if (question.options?.length) {
          for (const option of question.options) {
            assert(
              option.translationZh,
              `Reading question ${question.id} option ${option.id} must provide translationZh.`
            );
            assertNoBlockedEnglishWord(option.label, `Question ${question.id} option ${option.id} label`);
            assertNoBlockedEnglishWord(
              option.translationZh,
              `Question ${question.id} option ${option.id} translationZh`
            );
            assertNoBlockedChineseFragment(
              option.translationZh,
              `Question ${question.id} option ${option.id} translationZh`
            );
            assertNoEscapedNewlineArtifact(
              option.translationZh,
              `Question ${question.id} option ${option.id} translationZh`
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
