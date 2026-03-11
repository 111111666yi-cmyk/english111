"use client";

import { useMemo, useState } from "react";
import { getSentenceQuiz, getVocabularyQuiz } from "@/data/quizzes";
import { QuizCard } from "@/components/quiz-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { sentences, words } from "@/lib/content";
import { useLearningStore } from "@/stores/learning-store";

const totalTestQuestions = words.length + sentences.length;

function getTestQuiz(index: number) {
  if (index < words.length) {
    return getVocabularyQuiz(index);
  }

  return getSentenceQuiz(index - words.length);
}

export function TestModePanel() {
  const [index, setIndex] = useState(0);
  const reviewMistakes = useLearningStore((state) => state.reviewMistakes.length);
  const recordQuizResult = useLearningStore((state) => state.recordQuizResult);
  const logDailyProgress = useLearningStore((state) => state.logDailyProgress);

  const quiz = useMemo(() => getTestQuiz(index), [index]);
  const currentBucket = index < words.length ? "单词测试" : "句子测试";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">当前题号</p>
          <p className="mt-2 text-4xl font-black text-ink">
            {index + 1} / {totalTestQuestions}
          </p>
          <p className="mt-2 text-sm text-slate-500">{currentBucket}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">测试覆盖</p>
          <p className="mt-2 text-4xl font-black text-ink">{totalTestQuestions}</p>
          <p className="mt-2 text-sm text-slate-500">只包含单词和句子，不并入短文。</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">已入复习池</p>
          <p className="mt-2 text-4xl font-black text-ink">{reviewMistakes}</p>
          <p className="mt-2 text-sm text-slate-500">测试做错后会直接进入复习模块。</p>
        </Card>
      </div>

      <Card className="space-y-3 bg-white/80">
        <p className="text-base font-semibold text-ink">测试模式说明</p>
        <p className="text-sm leading-6 text-slate-500">
          这里不显示重点词、中文提示和音频捷径，尽量接近真正测验。你可以一直向后刷完整个题池，也可以用上一题回看刚做过的题。
        </p>
      </Card>

      <QuizCard
        quiz={quiz}
        variant="test"
        onResult={(correct) => {
          recordQuizResult(quiz.id, correct);
          logDailyProgress({
            words: 0,
            sentences: 0,
            passages: 0,
            reviews: 1,
            correct: correct ? 1 : 0,
            total: 1
          });
        }}
      />

      <div className="flex flex-wrap justify-between gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            setIndex((current) => (current - 1 < 0 ? totalTestQuestions - 1 : current - 1))
          }
        >
          上一题
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setIndex((current) => (current + 1 >= totalTestQuestions ? 0 : current + 1))}
        >
          下一题
        </Button>
      </div>
    </div>
  );
}
