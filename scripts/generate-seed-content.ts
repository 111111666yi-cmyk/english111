import fs from "node:fs";
import path from "node:path";
import { localizeReadingQuestion } from "./reading-question-localization";
import type { QuizItem as GeneratedQuizItem } from "../src/types/content";

type Level = "L1" | "L2" | "L3" | "L4" | "L5";

interface WordSeed {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  meaningZh: string;
  level: Level;
  tags: string[];
  exampleEn: string;
  exampleZh: string;
  difficulty: number;
  synonyms?: string[];
  focusPhrase: string;
}

interface SentenceSeed {
  id: string;
  sentenceEn: string;
  sentenceZh: string;
  keywords: string[];
  difficulty: number;
  grammarPoint: string;
  relatedWords: string[];
  missingWord: string;
  reorderAnswer: string;
  explanation: string;
}

interface PassageSeed {
  id: string;
  title: string;
  level: Level;
  topic: string;
  estimatedMinutes: number;
  contentEn: [string, string, string];
  contentZh: [string, string, string];
  keyWords: string[];
  answerMain: string;
  answerDetail: string;
  trueFalseStatement: string;
}

interface ExpressionSeed {
  id: string;
  level: Level;
  basic: string;
  advanced: string;
  meaningZh: string;
  exampleBasic: string;
  exampleAdvanced: string;
  noteZh: string;
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

function writeJson(relativePath: string, data: unknown) {
  const filePath = path.join(process.cwd(), relativePath);
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

const wordSeeds: WordSeed[] = [
  {
    word: "bridge",
    phonetic: "/brɪdʒ/",
    partOfSpeech: "noun",
    meaningZh: "桥梁；纽带",
    level: "L1",
    tags: ["reading", "daily-life"],
    exampleEn: "Reading can be a bridge between simple words and longer stories.",
    exampleZh: "阅读可以成为简单词汇和更长故事之间的桥梁。",
    difficulty: 1,
    synonyms: ["link"],
    focusPhrase: "a bridge between simple words and longer stories"
  },
  {
    word: "notice",
    phonetic: "/ˈnoʊ.tɪs/",
    partOfSpeech: "verb",
    meaningZh: "注意到",
    level: "L1",
    tags: ["reading", "study"],
    exampleEn: "Good readers notice small clues in a sentence.",
    exampleZh: "好的读者会注意到句子里的小线索。",
    difficulty: 1,
    synonyms: ["observe"],
    focusPhrase: "notice small clues in a sentence"
  },
  {
    word: "organize",
    phonetic: "/ˈɔːr.ɡə.naɪz/",
    partOfSpeech: "verb",
    meaningZh: "整理；组织",
    level: "L2",
    tags: ["study", "habit"],
    exampleEn: "She uses colors to organize her notes before a test.",
    exampleZh: "她会在考试前用颜色整理笔记。",
    difficulty: 2,
    synonyms: ["arrange"],
    focusPhrase: "organize her notes before a test"
  },
  {
    word: "beneficial",
    phonetic: "/ˌben.əˈfɪʃ.əl/",
    partOfSpeech: "adjective",
    meaningZh: "有益的",
    level: "L4",
    tags: ["health", "advanced"],
    exampleEn: "Short daily practice is beneficial for long-term memory.",
    exampleZh: "每天短时间练习对长期记忆是有益的。",
    difficulty: 3,
    synonyms: ["helpful"],
    focusPhrase: "beneficial for long-term memory"
  },
  {
    word: "crucial",
    phonetic: "/ˈkruː.ʃəl/",
    partOfSpeech: "adjective",
    meaningZh: "至关重要的",
    level: "L4",
    tags: ["logic", "advanced"],
    exampleEn: "Context is crucial when you guess the meaning of a new word.",
    exampleZh: "当你猜测生词词义时，上下文至关重要。",
    difficulty: 3,
    synonyms: ["essential"],
    focusPhrase: "context is crucial when you guess"
  },
  {
    word: "gradually",
    phonetic: "/ˈɡrædʒ.u.ə.li/",
    partOfSpeech: "adverb",
    meaningZh: "逐渐地",
    level: "L2",
    tags: ["growth", "study"],
    exampleEn: "He gradually became confident in reading short passages.",
    exampleZh: "他逐渐对阅读短文有了信心。",
    difficulty: 2,
    synonyms: ["slowly"],
    focusPhrase: "gradually became confident in reading"
  },
  {
    word: "improve",
    phonetic: "/ɪmˈpruːv/",
    partOfSpeech: "verb",
    meaningZh: "提高；改进",
    level: "L1",
    tags: ["growth", "study"],
    exampleEn: "She wants to improve her English by reading every night.",
    exampleZh: "她想通过每晚阅读来提高英语。",
    difficulty: 1,
    synonyms: ["develop"],
    focusPhrase: "improve her English by reading"
  },
  {
    word: "compare",
    phonetic: "/kəmˈper/",
    partOfSpeech: "verb",
    meaningZh: "比较",
    level: "L2",
    tags: ["analysis", "reading"],
    exampleEn: "The class learned to compare two short texts before writing.",
    exampleZh: "全班学会了在写作前比较两篇短文。",
    difficulty: 2,
    synonyms: ["contrast"],
    focusPhrase: "compare two short texts before writing"
  },
  {
    word: "support",
    phonetic: "/səˈpɔːrt/",
    partOfSpeech: "verb",
    meaningZh: "支持",
    level: "L2",
    tags: ["teamwork", "school"],
    exampleEn: "Pictures can support the meaning of a difficult passage.",
    exampleZh: "图片可以帮助理解一篇较难短文的意思。",
    difficulty: 2,
    synonyms: ["help"],
    focusPhrase: "support the meaning of a difficult passage"
  },
  {
    word: "focus",
    phonetic: "/ˈfoʊ.kəs/",
    partOfSpeech: "verb",
    meaningZh: "专注",
    level: "L2",
    tags: ["habit", "study"],
    exampleEn: "A quiet corner helps him focus on the key sentence.",
    exampleZh: "安静的角落能帮助他专注于重点句。",
    difficulty: 2,
    synonyms: ["concentrate"],
    focusPhrase: "focus on the key sentence"
  },
  {
    word: "practice",
    phonetic: "/ˈpræk.tɪs/",
    partOfSpeech: "noun",
    meaningZh: "练习",
    level: "L1",
    tags: ["habit", "study"],
    exampleEn: "Five minutes of practice can make new words stay longer.",
    exampleZh: "五分钟练习能让新单词记得更久。",
    difficulty: 1,
    synonyms: ["training"],
    focusPhrase: "five minutes of practice can help"
  },
  {
    word: "context",
    phonetic: "/ˈkɑːn.tekst/",
    partOfSpeech: "noun",
    meaningZh: "上下文",
    level: "L3",
    tags: ["reading", "meaning"],
    exampleEn: "He used context instead of a dictionary to guess the word.",
    exampleZh: "他用上下文而不是词典来猜这个单词。",
    difficulty: 3,
    synonyms: ["background"],
    focusPhrase: "used context instead of a dictionary"
  },
  {
    word: "phrase",
    phonetic: "/freɪz/",
    partOfSpeech: "noun",
    meaningZh: "短语",
    level: "L2",
    tags: ["language", "reading"],
    exampleEn: "One useful phrase can make a sentence sound more natural.",
    exampleZh: "一个实用短语可以让句子听起来更自然。",
    difficulty: 2,
    synonyms: ["expression"],
    focusPhrase: "one useful phrase can make"
  },
  {
    word: "choice",
    phonetic: "/tʃɔɪs/",
    partOfSpeech: "noun",
    meaningZh: "选择",
    level: "L2",
    tags: ["decision", "school"],
    exampleEn: "Her first choice was a short article about animals.",
    exampleZh: "她的第一选择是一篇关于动物的短文章。",
    difficulty: 2,
    synonyms: ["option"],
    focusPhrase: "her first choice was a short article"
  },
  {
    word: "library",
    phonetic: "/ˈlaɪ.brer.i/",
    partOfSpeech: "noun",
    meaningZh: "图书馆",
    level: "L1",
    tags: ["school", "reading"],
    exampleEn: "The library gives students a calm place to read after class.",
    exampleZh: "图书馆给学生提供了课后阅读的安静空间。",
    difficulty: 1,
    synonyms: ["reading room"],
    focusPhrase: "a calm place to read after class"
  },
  {
    word: "memory",
    phonetic: "/ˈmem.ər.i/",
    partOfSpeech: "noun",
    meaningZh: "记忆",
    level: "L2",
    tags: ["study", "brain"],
    exampleEn: "Review cards are useful when you want to train your memory.",
    exampleZh: "当你想训练记忆时，复习卡片很有用。",
    difficulty: 2,
    synonyms: ["recall"],
    focusPhrase: "train your memory with review cards"
  },
  {
    word: "challenge",
    phonetic: "/ˈtʃæl.ɪndʒ/",
    partOfSpeech: "noun",
    meaningZh: "挑战",
    level: "L2",
    tags: ["growth", "mindset"],
    exampleEn: "A long sentence can be a challenge, but it is not impossible.",
    exampleZh: "长句可能是一种挑战，但并非不可能。",
    difficulty: 2,
    synonyms: ["test"],
    focusPhrase: "a long sentence can be a challenge"
  },
  {
    word: "solution",
    phonetic: "/səˈluː.ʃən/",
    partOfSpeech: "noun",
    meaningZh: "解决办法",
    level: "L3",
    tags: ["thinking", "study"],
    exampleEn: "Writing down the clue was a simple solution to the problem.",
    exampleZh: "把线索写下来是解决问题的简单办法。",
    difficulty: 3,
    synonyms: ["answer"],
    focusPhrase: "a simple solution to the problem"
  },
  {
    word: "habit",
    phonetic: "/ˈhæb.ɪt/",
    partOfSpeech: "noun",
    meaningZh: "习惯",
    level: "L1",
    tags: ["habit", "daily-life"],
    exampleEn: "Reading before bed became a healthy study habit.",
    exampleZh: "睡前阅读成了一个健康的学习习惯。",
    difficulty: 1,
    synonyms: ["routine"],
    focusPhrase: "became a healthy study habit"
  },
  {
    word: "explore",
    phonetic: "/ɪkˈsplɔːr/",
    partOfSpeech: "verb",
    meaningZh: "探索",
    level: "L3",
    tags: ["curiosity", "reading"],
    exampleEn: "The class used short stories to explore new topics together.",
    exampleZh: "班级用短篇故事一起探索新主题。",
    difficulty: 2,
    synonyms: ["discover"],
    focusPhrase: "explore new topics together"
  },
  {
    word: "connect",
    phonetic: "/kəˈnekt/",
    partOfSpeech: "verb",
    meaningZh: "连接；联系",
    level: "L2",
    tags: ["reading", "logic"],
    exampleEn: "He tried to connect the new idea with an older lesson.",
    exampleZh: "他试着把新想法和以前的课程联系起来。",
    difficulty: 2,
    synonyms: ["link"],
    focusPhrase: "connect the new idea with an older lesson"
  },
  {
    word: "prepare",
    phonetic: "/prɪˈper/",
    partOfSpeech: "verb",
    meaningZh: "准备",
    level: "L1",
    tags: ["school", "plan"],
    exampleEn: "They prepare one question before each reading discussion.",
    exampleZh: "他们会在每次阅读讨论前准备一个问题。",
    difficulty: 1,
    synonyms: ["plan"],
    focusPhrase: "prepare one question before discussion"
  },
  {
    word: "review",
    phonetic: "/rɪˈvjuː/",
    partOfSpeech: "verb",
    meaningZh: "复习",
    level: "L1",
    tags: ["study", "habit"],
    exampleEn: "She reviews new words on the bus ride home.",
    exampleZh: "她会在回家的公交车上复习新单词。",
    difficulty: 1,
    synonyms: ["revise"],
    focusPhrase: "review new words on the bus"
  },
  {
    word: "useful",
    phonetic: "/ˈjuːs.fəl/",
    partOfSpeech: "adjective",
    meaningZh: "有用的",
    level: "L1",
    tags: ["daily-life", "reading"],
    exampleEn: "A useful note can save time during a quiz review.",
    exampleZh: "一条有用的笔记能在测验复习时节省时间。",
    difficulty: 1,
    synonyms: ["helpful"],
    focusPhrase: "a useful note can save time"
  },
  {
    word: "patient",
    phonetic: "/ˈpeɪ.ʃənt/",
    partOfSpeech: "adjective",
    meaningZh: "耐心的",
    level: "L2",
    tags: ["mindset", "growth"],
    exampleEn: "You need to be patient when a paragraph feels heavy.",
    exampleZh: "当一段文字读起来吃力时，你需要有耐心。",
    difficulty: 2,
    synonyms: ["calm"],
    focusPhrase: "be patient when a paragraph feels heavy"
  },
  {
    word: "confident",
    phonetic: "/ˈkɑːn.fə.dənt/",
    partOfSpeech: "adjective",
    meaningZh: "自信的",
    level: "L2",
    tags: ["growth", "mindset"],
    exampleEn: "She sounded confident after reading the sentence twice.",
    exampleZh: "把句子读了两遍后，她听起来更自信了。",
    difficulty: 2,
    synonyms: ["sure"],
    focusPhrase: "sounded confident after reading twice"
  },
  {
    word: "discover",
    phonetic: "/dɪˈskʌv.ɚ/",
    partOfSpeech: "verb",
    meaningZh: "发现",
    level: "L2",
    tags: ["curiosity", "reading"],
    exampleEn: "He discovered a better phrase while reading a short article.",
    exampleZh: "他在读短文时发现了一个更好的短语。",
    difficulty: 2,
    synonyms: ["find"],
    focusPhrase: "discovered a better phrase while reading"
  },
  {
    word: "repeat",
    phonetic: "/rɪˈpiːt/",
    partOfSpeech: "verb",
    meaningZh: "重复",
    level: "L1",
    tags: ["study", "audio"],
    exampleEn: "It helps to repeat a new sentence with a steady rhythm.",
    exampleZh: "用稳定的节奏重复新句子会有帮助。",
    difficulty: 1,
    synonyms: ["say again"],
    focusPhrase: "repeat a new sentence with rhythm"
  },
  {
    word: "simple",
    phonetic: "/ˈsɪm.pəl/",
    partOfSpeech: "adjective",
    meaningZh: "简单的",
    level: "L1",
    tags: ["reading", "daily-life"],
    exampleEn: "A simple explanation can lower the fear of reading.",
    exampleZh: "一个简单的解释可以降低对阅读的害怕感。",
    difficulty: 1,
    synonyms: ["easy"],
    focusPhrase: "a simple explanation can lower fear"
  },
  {
    word: "detail",
    phonetic: "/ˈdiː.teɪl/",
    partOfSpeech: "noun",
    meaningZh: "细节",
    level: "L2",
    tags: ["reading", "analysis"],
    exampleEn: "The answer was hidden in a small detail near the end.",
    exampleZh: "答案藏在结尾附近的一个小细节里。",
    difficulty: 2,
    synonyms: ["point"],
    focusPhrase: "hidden in a small detail"
  },
  {
    word: "skill",
    phonetic: "/skɪl/",
    partOfSpeech: "noun",
    meaningZh: "技能",
    level: "L2",
    tags: ["growth", "study"],
    exampleEn: "Guessing meaning from context is a reading skill.",
    exampleZh: "根据上下文猜词义是一项阅读技能。",
    difficulty: 2,
    synonyms: ["ability"],
    focusPhrase: "guessing meaning from context is a skill"
  },
  {
    word: "share",
    phonetic: "/ʃer/",
    partOfSpeech: "verb",
    meaningZh: "分享",
    level: "L1",
    tags: ["teamwork", "school"],
    exampleEn: "Students share one useful sentence at the end of class.",
    exampleZh: "学生会在下课前分享一句有用的句子。",
    difficulty: 1,
    synonyms: ["give"],
    focusPhrase: "share one useful sentence at the end"
  },
  {
    word: "curious",
    phonetic: "/ˈkjʊr.i.əs/",
    partOfSpeech: "adjective",
    meaningZh: "好奇的",
    level: "L2",
    tags: ["mindset", "reading"],
    exampleEn: "A curious mind asks why the writer chose that word.",
    exampleZh: "好奇的头脑会问作者为什么选了那个词。",
    difficulty: 2,
    synonyms: ["interested"],
    focusPhrase: "a curious mind asks why"
  },
  {
    word: "calm",
    phonetic: "/kɑːm/",
    partOfSpeech: "adjective",
    meaningZh: "冷静的",
    level: "L1",
    tags: ["mindset", "emotion"],
    exampleEn: "He stayed calm when the first answer was wrong.",
    exampleZh: "当第一题答错时，他依然保持冷静。",
    difficulty: 1,
    synonyms: ["steady"],
    focusPhrase: "stayed calm when the answer was wrong"
  },
  {
    word: "effort",
    phonetic: "/ˈef.ɚt/",
    partOfSpeech: "noun",
    meaningZh: "努力",
    level: "L2",
    tags: ["growth", "habit"],
    exampleEn: "Small daily effort often creates a bigger result.",
    exampleZh: "每天一点点努力常常会带来更大的结果。",
    difficulty: 2,
    synonyms: ["hard work"],
    focusPhrase: "small daily effort creates a result"
  },
  {
    word: "progress",
    phonetic: "/ˈprɑː.ɡres/",
    partOfSpeech: "noun",
    meaningZh: "进步",
    level: "L2",
    tags: ["growth", "study"],
    exampleEn: "Her reading progress became clear after one month.",
    exampleZh: "一个月后，她的阅读进步变得很明显。",
    difficulty: 2,
    synonyms: ["growth"],
    focusPhrase: "reading progress became clear"
  },
  {
    word: "creative",
    phonetic: "/kriˈeɪ.tɪv/",
    partOfSpeech: "adjective",
    meaningZh: "有创意的",
    level: "L3",
    tags: ["expression", "writing"],
    exampleEn: "The teacher praised her creative way of explaining the phrase.",
    exampleZh: "老师表扬了她解释短语时有创意的方法。",
    difficulty: 3,
    synonyms: ["original"],
    focusPhrase: "her creative way of explaining"
  },
  {
    word: "avoid",
    phonetic: "/əˈvɔɪd/",
    partOfSpeech: "verb",
    meaningZh: "避免",
    level: "L3",
    tags: ["strategy", "reading"],
    exampleEn: "He learned to avoid guessing before reading the whole line.",
    exampleZh: "他学会了在读完整行之前避免乱猜。",
    difficulty: 3,
    synonyms: ["prevent"],
    focusPhrase: "avoid guessing before reading the line"
  },
  {
    word: "include",
    phonetic: "/ɪnˈkluːd/",
    partOfSpeech: "verb",
    meaningZh: "包括",
    level: "L1",
    tags: ["reading", "detail"],
    exampleEn: "The worksheet includes one short text and three questions.",
    exampleZh: "这张练习纸包括一篇短文和三道问题。",
    difficulty: 1,
    synonyms: ["contain"],
    focusPhrase: "includes one short text and questions"
  },
  {
    word: "purpose",
    phonetic: "/ˈpɝː.pəs/",
    partOfSpeech: "noun",
    meaningZh: "目的",
    level: "L3",
    tags: ["logic", "writing"],
    exampleEn: "Knowing the writer's purpose helps you choose the best answer.",
    exampleZh: "知道作者的目的能帮助你选出最佳答案。",
    difficulty: 3,
    synonyms: ["goal"],
    focusPhrase: "knowing the writer's purpose helps"
  }
];

const extraSentenceSeeds: SentenceSeed[] = [
  {
    id: "sentence-study-routine",
    sentenceEn: "A short review after dinner can turn a busy day into a useful routine.",
    sentenceZh: "晚饭后的简短复习，能把忙碌的一天变成有效的学习习惯。",
    keywords: ["review", "useful", "routine"],
    difficulty: 2,
    grammarPoint: "can + 动词原形表示能力或可能。",
    relatedWords: ["review", "useful", "habit"],
    missingWord: "useful",
    reorderAnswer: "turn a busy day into a useful routine",
    explanation: "句子强调小复习如何把零散时间变成稳定习惯。"
  },
  {
    id: "sentence-keyword-clue",
    sentenceEn: "When you notice a keyword, the whole sentence becomes easier to follow.",
    sentenceZh: "当你注意到关键词时，整句话就更容易理解。",
    keywords: ["notice", "keyword", "follow"],
    difficulty: 2,
    grammarPoint: "when 引导时间状语从句。",
    relatedWords: ["notice", "detail", "skill"],
    missingWord: "keyword",
    reorderAnswer: "the whole sentence becomes easier to follow",
    explanation: "先抓关键词，再理解整句，是阅读中的常见步骤。"
  },
  {
    id: "sentence-upgrade-expression",
    sentenceEn: "Instead of saying very important, you can use crucial in a formal sentence.",
    sentenceZh: "与其说 very important，你可以在正式句子里使用 crucial。",
    keywords: ["instead of", "crucial", "formal"],
    difficulty: 4,
    grammarPoint: "instead of 用来表示替换表达。",
    relatedWords: ["crucial", "phrase", "choice"],
    missingWord: "important",
    reorderAnswer: "you can use crucial in a formal sentence",
    explanation: "这句展示了从基础表达升级到更自然表达的方式。"
  },
  {
    id: "sentence-reading-map",
    sentenceEn: "Before answering, she marked the topic sentence and two helpful details.",
    sentenceZh: "作答前，她先标出了主题句和两个有帮助的细节。",
    keywords: ["answering", "topic sentence", "details"],
    difficulty: 3,
    grammarPoint: "before + 动名词，表示某动作发生之前。",
    relatedWords: ["detail", "support", "prepare"],
    missingWord: "details",
    reorderAnswer: "marked the topic sentence and two helpful details",
    explanation: "先画出主题句和细节，能降低阅读理解的混乱感。"
  },
  {
    id: "sentence-group-discussion",
    sentenceEn: "The group discussion became smoother after everyone prepared one example.",
    sentenceZh: "每个人都准备一个例子之后，小组讨论进行得更顺了。",
    keywords: ["group discussion", "prepared", "example"],
    difficulty: 2,
    grammarPoint: "after 引导时间状语从句。",
    relatedWords: ["prepare", "share", "simple"],
    missingWord: "example",
    reorderAnswer: "everyone prepared one example",
    explanation: "阅读讨论中，提前准备例句能提升表达效率。"
  },
  {
    id: "sentence-audio-step",
    sentenceEn: "Listening once is useful, but repeating the line helps your memory more.",
    sentenceZh: "听一遍很有用，但重复句子会更帮助记忆。",
    keywords: ["listening", "repeating", "memory"],
    difficulty: 2,
    grammarPoint: "but 连接两个并列分句，形成对比。",
    relatedWords: ["repeat", "memory", "useful"],
    missingWord: "memory",
    reorderAnswer: "repeating the line helps your memory more",
    explanation: "听和跟读结合，比只听一次更容易记住表达。"
  },
  {
    id: "sentence-context-choice",
    sentenceEn: "He did not know the new word, but the context gave him a smart choice.",
    sentenceZh: "他虽然不认识新词，但上下文给了他一个聪明的判断。",
    keywords: ["new word", "context", "choice"],
    difficulty: 3,
    grammarPoint: "but 表示转折，前后信息相反。",
    relatedWords: ["context", "choice", "solution"],
    missingWord: "choice",
    reorderAnswer: "the context gave him a smart choice",
    explanation: "碰到生词时，先利用上下文通常比立刻查词更有效。"
  },
  {
    id: "sentence-library-plan",
    sentenceEn: "They met in the library so they could practice speaking in a calm place.",
    sentenceZh: "他们在图书馆见面，这样就能在安静的地方练习口语。",
    keywords: ["library", "practice", "calm"],
    difficulty: 2,
    grammarPoint: "so 引导结果，说明前项带来的作用。",
    relatedWords: ["library", "practice", "calm"],
    missingWord: "calm",
    reorderAnswer: "practice speaking in a calm place",
    explanation: "学习环境会直接影响专注和表达状态。"
  },
  {
    id: "sentence-effort-progress",
    sentenceEn: "Her progress looked small each day, but the effort added up every week.",
    sentenceZh: "她每天的进步看起来很小，但努力会在每周累积起来。",
    keywords: ["progress", "effort", "week"],
    difficulty: 2,
    grammarPoint: "but 引出对比，强调长期累积效果。",
    relatedWords: ["progress", "effort", "gradually"],
    missingWord: "effort",
    reorderAnswer: "the effort added up every week",
    explanation: "持续输入的价值，往往是按周而不是按天显现。"
  },
  {
    id: "sentence-purpose-reading",
    sentenceEn: "Once you know the writer's purpose, the main idea becomes easier to catch.",
    sentenceZh: "一旦你知道作者的目的，主旨就更容易抓住。",
    keywords: ["writer's purpose", "main idea", "catch"],
    difficulty: 3,
    grammarPoint: "once 表示一旦发生某条件，结果随之而来。",
    relatedWords: ["purpose", "detail", "support"],
    missingWord: "purpose",
    reorderAnswer: "the main idea becomes easier to catch",
    explanation: "先判断作者意图，再做主旨题会更稳。"
  },
  {
    id: "sentence-curious-question",
    sentenceEn: "A curious reader keeps asking why a phrase sounds natural in context.",
    sentenceZh: "一个好奇的读者会不断追问：为什么这个短语在语境里听起来自然。",
    keywords: ["curious", "phrase", "context"],
    difficulty: 3,
    grammarPoint: "why 引导宾语从句，解释提问内容。",
    relatedWords: ["curious", "phrase", "context"],
    missingWord: "natural",
    reorderAnswer: "a phrase sounds natural in context",
    explanation: "对表达方式保持好奇，才能逐渐积累语感。"
  },
  {
    id: "sentence-avoid-rush",
    sentenceEn: "If you avoid rushing, you can compare the options with a clearer mind.",
    sentenceZh: "如果你避免着急，就能更清楚地比较选项。",
    keywords: ["avoid", "compare", "clearer"],
    difficulty: 3,
    grammarPoint: "if 引导条件状语从句。",
    relatedWords: ["avoid", "compare", "calm"],
    missingWord: "compare",
    reorderAnswer: "compare the options with a clearer mind",
    explanation: "做题时先慢下来，才能真正利用比较和排除。"
  }
];

const passageSeeds: PassageSeed[] = [
  {
    id: "passage-reading-club",
    title: "The Small Reading Club",
    level: "L3",
    topic: "school",
    estimatedMinutes: 6,
    contentEn: [
      "Mina and her friends started a reading club in the school library. They did not choose long novels at first. Instead, they picked short stories with clear topics and useful words.",
      "Every Friday, each student shared one sentence that they liked. Then the group discussed why the sentence worked well. Sometimes they noticed a new phrase, and sometimes they found a better way to say a simple idea.",
      "After two months, Mina felt a real change. She still met difficult words, but she was no longer afraid of them. She learned to use context, examples, and repeated reading to understand more."
    ],
    contentZh: [
      "米娜和朋友们在学校图书馆成立了一个阅读俱乐部。她们一开始没有选择长篇小说，而是挑选主题清楚、词汇实用的短篇故事。",
      "每周五，每位学生都会分享一句自己喜欢的句子。然后小组讨论为什么这句话写得好。有时她们会注意到一个新短语，有时会发现表达简单想法的更好方式。",
      "两个月后，米娜感受到了真实的变化。她仍然会遇到难词，但已经不再害怕。她学会了利用上下文、例子和重复阅读来理解更多内容。"
    ],
    keyWords: ["context", "phrase", "shared", "afraid", "repeated"],
    answerMain: "They wanted an easier path from words to short reading.",
    answerDetail: "They shared one sentence every Friday.",
    trueFalseStatement: "The club began with long novels because the students wanted a hard challenge."
  },
  {
    id: "passage-science-corner",
    title: "Notes from the Science Corner",
    level: "L3",
    topic: "simple science",
    estimatedMinutes: 5,
    contentEn: [
      "Ken liked science, but English science texts felt heavy to him. To improve, he chose short passages about plants, weather, and simple machines. He wrote the main idea of each text in one short sentence.",
      "When Ken saw a new word, he did not stop at once. He compared the new word with the picture, the title, and the sentence around it. This habit helped him avoid weak guesses.",
      "After a few weeks, Ken discovered that science reading was less frightening. He still needed support from his teacher, yet he could already explain small ideas in English with more confidence."
    ],
    contentZh: [
      "肯喜欢科学，但英文科普短文对他来说很吃力。为了提高，他挑选了关于植物、天气和简单机械的短文来读。他会把每篇文章的主旨写成一句短句。",
      "当肯看到生词时，他不会立刻停下来。他会把新词和图片、标题以及周围句子进行比较。这个习惯帮助他避免不可靠的猜测。",
      "几周后，肯发现科学阅读没那么可怕了。他仍然需要老师的支持，但已经能更有信心地用英语解释一些小概念。"
    ],
    keyWords: ["improve", "compare", "habit", "avoid", "confidence"],
    answerMain: "He built a better way to read simple science texts.",
    answerDetail: "He wrote the main idea in one short sentence.",
    trueFalseStatement: "Ken stopped reading every time he met a new word."
  },
  {
    id: "passage-garden-journal",
    title: "The Garden Journal",
    level: "L3",
    topic: "daily life",
    estimatedMinutes: 5,
    contentEn: [
      "Luna joined the school garden team because she wanted a calm activity after class. The team planted tomatoes, mint, and beans, then kept a short English journal for each week.",
      "At first, Luna only wrote simple details such as color, size, and weather. Later, she became curious about better words. She started to include phrases like grow slowly, need more light, and look healthy.",
      "By the end of the term, Luna could read her old notes and see clear progress. The journal was not long, but it gave her a useful bridge from daily words to short descriptions."
    ],
    contentZh: [
      "露娜加入学校园艺小组，是因为她想在放学后做一项安静的活动。小组种植西红柿、薄荷和豆类，并且每周写一篇简短的英文记录。",
      "一开始，露娜只写颜色、大小和天气这类简单细节。后来她对更好的表达产生了好奇，开始加入 grow slowly、need more light 和 look healthy 这样的短语。",
      "到学期末，露娜能读回自己以前的记录，并看到清晰的进步。日记并不长，但它给了她一座从日常词汇通向简短描述的桥梁。"
    ],
    keyWords: ["calm", "details", "curious", "include", "progress"],
    answerMain: "The journal helped Luna move from simple words to short descriptions.",
    answerDetail: "She first wrote about color, size, and weather.",
    trueFalseStatement: "Luna wrote long reports about the garden from the first week."
  },
  {
    id: "passage-bus-ride-review",
    title: "Review on the Bus",
    level: "L3",
    topic: "daily life",
    estimatedMinutes: 4,
    contentEn: [
      "Every afternoon, Hao had a thirty-minute bus ride home. He decided to use the first ten minutes for review because he often forgot new phrases before dinner.",
      "Hao did not try to remember everything. He picked three words, one sentence, and one question from class. Then he repeated them in a low voice and checked whether he still knew the meaning.",
      "This routine looked small, but the result was beneficial. Hao felt more prepared in class, and he needed less time to warm up when a quiz started."
    ],
    contentZh: [
      "每天下午，浩回家要坐三十分钟公交车。他决定把前十分钟用来复习，因为他经常在晚饭前就忘了新短语。",
      "浩不会试图把所有内容都记住。他会挑出三个单词、一句话和一个课堂问题，然后用很低的声音重复，并检查自己是否还知道它们的意思。",
      "这个习惯看起来很小，但效果却很有益。浩在课堂上觉得自己准备得更充分，测验开始时也不再需要太久进入状态。"
    ],
    keyWords: ["review", "repeat", "routine", "beneficial", "prepared"],
    answerMain: "A small review routine made Hao more prepared for class.",
    answerDetail: "He reviewed on the bus ride home.",
    trueFalseStatement: "Hao tried to remember every sentence from the lesson on the bus."
  },
  {
    id: "passage-poster-team",
    title: "A Poster for the Travel Fair",
    level: "L3",
    topic: "travel",
    estimatedMinutes: 5,
    contentEn: [
      "Sara's class planned a travel fair, and her group chose Hangzhou for their poster. Sara liked the pictures, but she wanted the English part to sound natural as well.",
      "The group first organized the poster into three parts: food, places, and local stories. Then they compared simple words with better expressions. For example, they changed very beautiful to peaceful and memorable.",
      "On presentation day, Sara felt more confident than before. She discovered that a clear structure and careful word choice could support both meaning and style."
    ],
    contentZh: [
      "萨拉的班级要办一个旅行展，她的小组为杭州制作海报。萨拉喜欢图片，但她也希望英文部分听起来自然。",
      "小组先把海报整理成三个部分：食物、地点和当地故事。接着他们比较简单词和更好的表达，例如把 very beautiful 改成 peaceful 和 memorable。",
      "展示那天，萨拉比以前更自信。她发现清晰结构和谨慎的用词可以同时支持内容和表达风格。"
    ],
    keyWords: ["organized", "compared", "confident", "choice", "support"],
    answerMain: "The poster team improved both structure and word choice.",
    answerDetail: "They organized the poster into three parts.",
    trueFalseStatement: "Sara only cared about the pictures and ignored the English wording."
  },
  {
    id: "passage-breakfast-challenge",
    title: "The Breakfast Challenge",
    level: "L3",
    topic: "health",
    estimatedMinutes: 5,
    contentEn: [
      "Mr. Lin gave the class a simple challenge: eat breakfast every day for two weeks and write one short note about it. Many students were surprised because the task looked too easy.",
      "After several days, the notes became more detailed. Students compared their energy in the first class, and some of them noticed that a small healthy habit changed their focus.",
      "In the final discussion, the class agreed on one useful idea. A simple routine may not look exciting, but repeated effort can create clear progress."
    ],
    contentZh: [
      "林老师给全班布置了一个简单挑战：连续两周每天吃早餐，并写一句简短记录。很多学生很惊讶，因为这个任务看起来太容易了。",
      "几天后，这些记录变得更详细了。学生们比较自己第一节课的精力状态，有些人注意到一个小小的健康习惯改变了专注力。",
      "在最后的讨论中，全班都认同一个有用的结论：简单的习惯看起来不刺激，但重复的努力能够带来清晰进步。"
    ],
    keyWords: ["challenge", "detailed", "habit", "focus", "progress"],
    answerMain: "Repeated healthy habits can create visible progress.",
    answerDetail: "Students wrote one short note each day.",
    trueFalseStatement: "The class stopped the challenge after only one breakfast."
  },
  {
    id: "passage-robot-team",
    title: "Learning from the Robot Team",
    level: "L4",
    topic: "technology",
    estimatedMinutes: 6,
    contentEn: [
      "Jun joined the robot team because he loved machines, but the English manual looked difficult. The teacher told the team to read one section at a time and underline the purpose of each step.",
      "Jun and his partner used color to connect the pictures with the instructions. When they found an unknown phrase, they did not panic. They looked at the next step and asked what action the robot needed first.",
      "By the third meeting, Jun could explain more parts of the manual aloud. He learned that clear purpose, context, and teamwork were crucial when a technical passage looked complex."
    ],
    contentZh: [
      "俊加入机器人小组是因为他喜欢机械，但英文说明书看起来很难。老师让他们一次只读一个部分，并划出每一步的目的。",
      "俊和搭档用颜色把图片和说明联系起来。当他们遇到陌生短语时，并没有慌张，而是看下一步并问：机器人首先需要什么动作？",
      "到第三次活动时，俊已经能大声解释更多说明书内容了。他学会了：当技术短文看起来复杂时，明确目的、利用上下文和团队合作都至关重要。"
    ],
    keyWords: ["purpose", "connect", "context", "teamwork", "crucial"],
    answerMain: "Jun learned how to read a complex manual step by step.",
    answerDetail: "He underlined the purpose of each step.",
    trueFalseStatement: "Jun solved every unknown phrase by giving up the task."
  },
  {
    id: "passage-weekend-market",
    title: "Words from the Weekend Market",
    level: "L3",
    topic: "daily life",
    estimatedMinutes: 5,
    contentEn: [
      "Nora visited the weekend market with a notebook in her hand. She wanted to collect useful words from signs, menus, and short conversations around her.",
      "At first, Nora only wrote single words. Later, she discovered that short phrases were more powerful. Fresh today, cash only, and handmade with care helped her understand real-life English more clearly.",
      "When Nora reviewed the notebook at home, she felt curious instead of tired. The market had given her a simple but creative way to connect study with daily life."
    ],
    contentZh: [
      "诺拉周末去集市时，手里拿着一个小笔记本。她想从招牌、菜单和周围的简短对话里收集有用表达。",
      "一开始，诺拉只写单个词。后来她发现短语更有力量。Fresh today、cash only 和 handmade with care 让她更清楚地理解真实生活中的英语。",
      "回家复习笔记时，诺拉感到的是好奇而不是疲惫。这个集市给了她一种简单却有创意的方式，把学习和日常生活连接起来。"
    ],
    keyWords: ["useful", "phrases", "curious", "creative", "connect"],
    answerMain: "Nora used the market to collect useful real-life English.",
    answerDetail: "She wrote down words from signs and menus.",
    trueFalseStatement: "Nora decided that phrases were less useful than single words."
  }
];

const expressionSeeds: ExpressionSeed[] = [
  {
    id: "expression-important",
    level: "L4",
    basic: "very important",
    advanced: "crucial",
    meaningZh: "非常重要的 -> 至关重要的",
    exampleBasic: "Sleep is very important for students.",
    exampleAdvanced: "Sleep is crucial for students.",
    noteZh: "crucial 更紧凑，也更适合书面和正式表达。"
  },
  {
    id: "expression-good-for-you",
    level: "L4",
    basic: "good for you",
    advanced: "beneficial",
    meaningZh: "对你有好处 -> 有益的",
    exampleBasic: "Daily reading is good for you.",
    exampleAdvanced: "Daily reading is beneficial.",
    noteZh: "beneficial 常用来描述长期收益，比 good for you 更正式。"
  },
  {
    id: "expression-very-calm",
    level: "L3",
    basic: "very calm",
    advanced: "steady",
    meaningZh: "非常冷静 -> 沉稳的",
    exampleBasic: "She stayed very calm during the quiz.",
    exampleAdvanced: "She stayed steady during the quiz.",
    noteZh: "steady 常强调状态稳定，适合写作或口语中的成熟表达。"
  },
  {
    id: "expression-very-clear",
    level: "L3",
    basic: "very clear",
    advanced: "well-defined",
    meaningZh: "非常清楚 -> 明确的",
    exampleBasic: "The writer's idea is very clear.",
    exampleAdvanced: "The writer's idea is well-defined.",
    noteZh: "well-defined 适合描述观点、结构和任务要求。"
  },
  {
    id: "expression-get-better",
    level: "L3",
    basic: "get better",
    advanced: "improve steadily",
    meaningZh: "变得更好 -> 稳定提升",
    exampleBasic: "Your reading will get better soon.",
    exampleAdvanced: "Your reading will improve steadily.",
    noteZh: "improve steadily 适合强调过程，不只是结果。"
  },
  {
    id: "expression-find-out",
    level: "L3",
    basic: "find out",
    advanced: "discover",
    meaningZh: "找到；弄清 -> 发现",
    exampleBasic: "He found out a better answer.",
    exampleAdvanced: "He discovered a better answer.",
    noteZh: "discover 更适合正式语境，也更适合写作。"
  }
];

const wordLookup = new Map(wordSeeds.map((word) => [word.word, word]));

const generatedWordEntries = wordSeeds.map((word) => {
  const slug = slugify(word.word);

  return {
    id: `word-${slug}`,
    word: word.word,
    phonetic: word.phonetic,
    partOfSpeech: word.partOfSpeech,
    meaningZh: word.meaningZh,
    level: word.level,
    tags: word.tags,
    exampleEn: word.exampleEn,
    exampleZh: word.exampleZh,
    synonyms: word.synonyms ?? [],
    pronunciationText: word.word,
    difficulty: word.difficulty,
    audioLocal: `/audio/words/${slug}.wav`
  };
});

const sentenceSeedsFromWords: SentenceSeed[] = wordSeeds.map((word) => ({
  id: `sentence-${slugify(word.word)}`,
  sentenceEn: word.exampleEn,
  sentenceZh: word.exampleZh,
  keywords: unique([word.word, ...(word.synonyms ?? []).slice(0, 1)]),
  difficulty: Math.max(1, Math.min(4, word.difficulty)),
  grammarPoint:
    word.level === "L4"
      ? "留意正式表达在语境里的作用，重点观察上下文和语义强度。"
      : "先抓关键词，再借助上下文理解整句，是基础句子训练的核心。",
  relatedWords: unique([word.word, ...(word.synonyms ?? []).slice(0, 1)]),
  missingWord: word.word,
  reorderAnswer: word.focusPhrase,
  explanation: `${word.word} 在这里不是孤立记忆，而是放进真实语境里理解。`
}));

const generatedSentences = [...sentenceSeedsFromWords, ...extraSentenceSeeds].map(
  (sentence, index) => {
    const tokens = sentence.reorderAnswer.replace(/[.,!?]/g, "").split(/\s+/).filter(Boolean);
    const keywordAudio = Object.fromEntries(
      sentence.keywords
        .map((keyword) => {
          const lowered = keyword.toLowerCase();
          const matched = wordLookup.get(lowered) ?? wordLookup.get(keyword);
          return matched ? [keyword, `/audio/words/${slugify(matched.word)}.wav`] : null;
        })
        .filter(Boolean) as Array<[string, string]>
    );

    return {
      ...sentence,
      jumbled: rotateTokens(tokens, (index % Math.max(tokens.length, 1)) || 1),
      audioLocal: `/audio/sentences/${sentence.id}.wav`,
      keywordAudio
    };
  }
);

const generatedPassages = passageSeeds.map((passage) => {
  return {
  id: passage.id,
  title: passage.title,
  level: passage.level,
  topic: passage.topic,
  contentEn: passage.contentEn,
  contentZh: passage.contentZh,
  keyWords: passage.keyWords,
  estimatedMinutes: passage.estimatedMinutes,
  audioLocal: `/audio/passages/${passage.id}.wav`,
  paragraphAudio: passage.contentEn.map((_, index) => `/audio/passages/${passage.id}-p${index + 1}.wav`),
  questions: [
    {
      id: `${passage.id}-q1`,
      type: "reading-question",
      questionId: `${passage.id}:main-idea`,
      prompt: "What is the main idea of this passage?",
      promptZh: "这篇短文的主旨是什么？",
      options: [
        { id: "a", label: passage.answerMain, translationZh: "姝ｇ‘绛旀鐨勪腑鏂囧皢鍦ㄧ敓鎴愬唴瀹规椂鍚屾鍐欏叆銆?" },
        { id: "b", label: "The writer wanted to stop reading and avoid new words.", translationZh: "浣滆€呮兂鍋滄闃呰锛屽苟涓旇翰寮€鎵€鏈夋柊鍗曡瘝銆?" },
        { id: "c", label: "The class decided that short English texts were a waste of time.", translationZh: "鍏ㄧ彮瑙夊緱绠€鐭嫳鏂囨潗鏂欐槸鍦ㄦ氮璐规椂闂淬€?" }
      ],
      answer: "a",
      answerText: passage.answerMain,
      explanation: "主旨题通常要看全文反复出现的目标、方法和结果。",
      relatedWords: passage.keyWords.slice(0, 2),
      difficulty: 2,
      sourceRef: passage.id
    },
    {
      id: `${passage.id}-q2`,
      type: "reading-question",
      questionId: `${passage.id}:mentioned-detail`,
      prompt: "Which detail is mentioned in the passage?",
      promptZh: "文中提到了哪一个细节？",
      options: [
        { id: "a", label: passage.answerDetail, translationZh: "姝ｇ‘缁嗚妭鐨勪腑鏂囧皢鍦ㄧ敓鎴愬唴瀹规椂鍚屾鍐欏叆銆?" },
        { id: "b", label: "They sold all of their books to buy a new dictionary.", translationZh: "浠栦滑鍗栨帀浜嗘墍鏈夌殑涔︼紝鍙负浜嗕拱涓€鏈柊璇嶅吀銆?" },
        { id: "c", label: "The teacher cancelled every discussion after one week.", translationZh: "鑰佸笀鍦ㄤ竴鍛ㄥ悗鍙栨秷浜嗘墍鏈夎璁恒€?" }
      ],
      answer: "a",
      answerText: passage.answerDetail,
      explanation: "细节题要回到对应段落，找出文中明确说过的信息。",
      relatedWords: passage.keyWords.slice(1, 4),
      difficulty: 3,
      sourceRef: passage.id
    },
    {
      id: `${passage.id}-q3`,
      type: "reading-question",
      questionId: `${passage.id}:true-false`,
      prompt: passage.trueFalseStatement,
      promptZh: "判断下面这句话是否正确。",
      promptSupplementZh: passage.trueFalseStatement,
      options: [
        { id: "true", label: "True", translationZh: "姝ｇ‘" },
        { id: "false", label: "False", translationZh: "閿欒" }
      ],
      answer: "false",
      answerText: "False",
      explanation: "判断题要先核对原文，再看题干有没有偷换条件或夸大信息。",
      relatedWords: passage.keyWords.slice(-2),
      difficulty: 2,
      sourceRef: passage.id,
      meta: {
        mode: "true-false"
      }
    }
  ].map((question) => localizeReadingQuestion(question as GeneratedQuizItem))
  };
});

const generatedExpressions = expressionSeeds.map((expression) => ({
  ...expression,
  audioLocalBasic: `/audio/expressions/${slugify(expression.basic)}.wav`,
  audioLocalAdvanced: `/audio/expressions/${slugify(expression.advanced)}.wav`
}));

writeJson("src/data/words.json", generatedWordEntries);
writeJson("src/data/sentences.json", generatedSentences);
writeJson("src/data/passages.json", generatedPassages);
writeJson("src/data/expressions.json", generatedExpressions);

console.log(
  `Generated ${generatedWordEntries.length} words, ${generatedSentences.length} sentences, ${generatedPassages.length} passages, and ${generatedExpressions.length} expressions.`
);
