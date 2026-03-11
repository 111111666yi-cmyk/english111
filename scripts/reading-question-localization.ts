import type { PassageEntry, QuizItem, QuizOption } from "../src/types/content";

const exactReadingTranslations = new Map<string, string>([
  ["True", "正确"],
  ["False", "错误"],
  ["They wanted an easier path from words to short reading.", "他们想找到一条从单词学习顺畅走向短文阅读的更轻松路径。"],
  ["The writer wanted to stop reading and avoid new words.", "作者想停止阅读，并且躲开所有新单词。"],
  ["The class decided that short English texts were a waste of time.", "全班觉得简短英文材料是在浪费时间。"],
  ["They shared one sentence every Friday.", "他们每周五都会分享一句自己喜欢的句子。"],
  ["They sold all of their books to buy a new dictionary.", "他们卖掉了所有的书，只为了买一本新词典。"],
  ["The teacher cancelled every discussion after one week.", "老师在一周后取消了所有讨论。"],
  ["The club began with long novels because the students wanted a hard challenge.", "这个俱乐部一开始就读长篇小说，因为学生们想挑战更难的内容。"],
  ["He built a better way to read simple science texts.", "他逐渐建立起一套更好的方法来阅读简单的英文科普短文。"],
  ["He wrote the main idea in one short sentence.", "他会把文章主旨写成一句短句。"],
  ["Ken stopped reading every time he met a new word.", "肯每次遇到生词都会立刻停止阅读。"],
  ["The journal helped Luna move from simple words to short descriptions.", "这本记录本帮助露娜从简单词汇过渡到简短描述。"],
  ["She first wrote about color, size, and weather.", "她最开始写的是颜色、大小和天气这些细节。"],
  ["Luna wrote long reports about the garden from the first week.", "露娜从第一周开始就写很长的园艺报告。"],
  ["A small review routine made Hao more prepared for class.", "一个小小的复习习惯让浩在上课前准备得更充分。"],
  ["He reviewed on the bus ride home.", "他会在回家路上的公交车上复习。"],
  ["Hao tried to remember every sentence from the lesson on the bus.", "浩在公交车上试图把课堂里的每一句话都背下来。"],
  ["The poster team improved both structure and word choice.", "海报小组同时提升了结构安排和用词选择。"],
  ["They organized the poster into three parts.", "他们把海报整理成了三个部分。"],
  ["Sara only cared about the pictures and ignored the English wording.", "萨拉只在意图片，完全忽略了英文表达。"],
  ["Repeated healthy habits can create visible progress.", "重复坚持健康习惯，会带来看得见的进步。"],
  ["Students wrote one short note each day.", "学生们每天都会写一句简短记录。"],
  ["The class stopped the challenge after only one breakfast.", "全班只吃了一次早餐就结束了这项挑战。"],
  ["Jun learned how to read a complex manual step by step.", "俊学会了怎样一步一步读懂复杂说明书。"],
  ["He underlined the purpose of each step.", "他会划出每一步的目的。"],
  ["Jun solved every unknown phrase by giving up the task.", "俊一遇到陌生短语就直接放弃任务。"],
  ["Nora used the market to collect useful real-life English.", "诺拉借助集市收集真实生活中有用的英文表达。"],
  ["She wrote down words from signs and menus.", "她记下了招牌和菜单里的词语。"],
  ["Nora decided that phrases were less useful than single words.", "诺拉后来认为短语没有单个词好用。"],
  ["A small reading routine helps students turn basic words into useful tools.", "一个小型阅读习惯能帮助学生把基础词汇变成真正有用的工具。"],
  ["The class decided to stop reading because every word was too difficult.", "全班决定停止阅读，因为每个单词都太难了。"],
  ["The writer only cared about long novels and ignored short texts.", "作者只在意长篇小说，完全忽视了短篇材料。"],
  ["The class wrote one short sentence for each word.", "全班会为每个单词各写一句短句。"],
  ["The students sold their books before class began.", "学生们在上课前把自己的书都卖掉了。"],
  ["The teacher cancelled the plan after one day.", "老师在第一天之后就取消了整个计划。"],
  ["The students thought basic words were always useless.", "学生们认为基础词永远没有用。"]
]);

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function translateReadingText(text: string) {
  return exactReadingTranslations.get(text.trim());
}

function localizeOption(option: QuizOption) {
  const translationZh = option.translationZh ?? option.detail ?? translateReadingText(option.label);

  return {
    ...option,
    translationZh,
    detail: option.detail ?? translationZh
  };
}

function buildAnswerText(answer: QuizItem["answer"], options?: QuizOption[]) {
  if (Array.isArray(answer)) {
    return answer.join(" / ");
  }

  const token = String(answer);
  const option = options?.find((item) => normalize(item.id) === normalize(token));

  if (option) {
    return option.translationZh ? `${option.label}（${option.translationZh}）` : option.label;
  }

  if (normalize(token) === "true") {
    return "True（正确）";
  }

  if (normalize(token) === "false") {
    return "False（错误）";
  }

  return token;
}

export function localizeReadingQuestion(question: QuizItem) {
  if (question.type !== "reading-question") {
    return question;
  }

  const options = question.options?.map(localizeOption);
  const promptSupplementZh =
    question.promptSupplementZh ??
    (question.meta?.mode === "true-false" ? translateReadingText(question.prompt) : undefined);

  return {
    ...question,
    options,
    promptSupplementZh,
    answerText: question.answerText ?? buildAnswerText(question.answer, options)
  };
}

export function localizePassages(passages: PassageEntry[]) {
  return passages.map((passage) => ({
    ...passage,
    questions: passage.questions.map(localizeReadingQuestion)
  }));
}
