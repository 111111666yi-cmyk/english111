const blockedEnglishWords = [
  "anal",
  "anus",
  "bitch",
  "cock",
  "dick",
  "fuck",
  "fucking",
  "penis",
  "piss",
  "porn",
  "sex",
  "sexy",
  "shit",
  "vagina",
  "casino",
  "casinos",
  "cigarette",
  "cigarettes",
  "drug",
  "drugs",
  "gambling",
  "beer",
  "bloody",
  "vodka",
  "whisky",
  "whiskey",
  "wine",
  "tobacco"
] as const;

const blockedChineseFragments = [
  "赌场",
  "赌博",
  "毒品",
  "香烟",
  "啤酒",
  "葡萄酒",
  "威士忌",
  "伏特加",
  "烟草",
  "血腥",
  "色情",
  "阴茎",
  "阴道",
  "肛门"
] as const;

const lowQualityChineseMarkers = [
  "男子名",
  "女子名",
  "姓氏",
  "人名",
  "地名",
  "协会",
  "公司",
  "委员会",
  "系统",
  "接口",
  "缩写",
  "研究站",
  "版本系统",
  "平均时",
  "数字化视频",
  "电子贸易服务",
  "前轮驱动",
  "四轮驱动"
] as const;

const inflectedFormMarkers = [
  "过去式",
  "过去分词",
  "现在分词",
  "复数形式",
  "复数）",
  "三单形式"
] as const;

const blockedWordPattern = new RegExp(`\\b(?:${blockedEnglishWords.join("|")})\\b`, "i");
const blockedChinesePattern = new RegExp(blockedChineseFragments.join("|"), "i");
const lowQualityMarkerPattern = new RegExp(lowQualityChineseMarkers.join("|"), "i");
const inflectedMarkerPattern = new RegExp(inflectedFormMarkers.join("|"), "i");
const abbreviationPattern = /\babbr\./i;
const expansionPattern = /\b[A-Z]{2,}(?:\s+[A-Z][A-Za-z]+)*\b/;

export function containsBlockedEnglishWord(value: string) {
  return blockedWordPattern.test(value);
}

export function containsBlockedChineseFragment(value: string) {
  return blockedChinesePattern.test(value);
}

export function containsUnsafeLearnerContent(value: string) {
  return containsBlockedEnglishWord(value) || containsBlockedChineseFragment(value);
}

export function containsEscapedNewlineArtifact(value: string) {
  return /\\n|\\r/.test(value);
}

export function containsLowQualityMeaningMarker(value: string) {
  return (
    containsEscapedNewlineArtifact(value) ||
    lowQualityMarkerPattern.test(value) ||
    inflectedMarkerPattern.test(value)
  );
}

export function normalizeMeaningZh(raw: string) {
  const normalized = raw
    .replace(/\\r/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\[[^\]]*]/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/（[^）]*）/g, "")
    .replace(/\b(abbr|adj|adv|art|aux|conj|n|num|pl|pref|prep|pron|suf|suffix|v|vi|vt)\b\.?/gi, "")
    .replace(/(^|[\n/;；])\s*[A-Za-z-]+\.\s*/g, "$1")
    .replace(/[;"'`]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const chunks = normalized
    .split(/[\n/\\;；]/)
    .map((chunk) => chunk.replace(/[，,、:：]+$/g, "").trim())
    .filter(Boolean);

  return chunks[0] ?? "";
}

export function isSafeLearnerWord(word: string, translation: string) {
  return !containsUnsafeLearnerContent(word) && !containsUnsafeLearnerContent(translation);
}

export function isSuitableDictionaryRow(word: string, rawTranslation: string, rawDefinition: string) {
  const meaning = normalizeMeaningZh(rawTranslation);

  if (!meaning || meaning.length < 2) {
    return false;
  }

  if (!isSafeLearnerWord(word, `${rawTranslation} ${meaning} ${rawDefinition}`)) {
    return false;
  }

  if (containsLowQualityMeaningMarker(rawTranslation) || containsLowQualityMeaningMarker(meaning)) {
    return false;
  }

  if (abbreviationPattern.test(rawTranslation) || abbreviationPattern.test(rawDefinition)) {
    return false;
  }

  if (expansionPattern.test(rawTranslation) || expansionPattern.test(rawDefinition)) {
    return false;
  }

  return true;
}

const contentHygiene = {
  containsBlockedChineseFragment,
  containsBlockedEnglishWord,
  containsEscapedNewlineArtifact,
  containsLowQualityMeaningMarker,
  containsUnsafeLearnerContent,
  inflectedMarkerPattern,
  isSafeLearnerWord,
  isSuitableDictionaryRow,
  normalizeMeaningZh
};

export default contentHygiene;
