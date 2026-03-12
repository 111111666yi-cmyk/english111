import { validateContentData } from "./validate-data-core";

validateContentData({
  minWords: 300,
  minSentences: 300,
  minPassages: 24,
  requireReadingQuestionLocalization: false
});

console.log("Development content validation passed.");
