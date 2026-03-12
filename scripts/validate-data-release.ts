import { validateContentData } from "./validate-data-core";

validateContentData({
  minWords: 3500,
  minSentences: 3500,
  minPassages: 120,
  requireReadingQuestionLocalization: true
});

console.log("Release content validation passed.");
