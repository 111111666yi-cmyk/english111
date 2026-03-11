"use client";

import { useMemo, useState } from "react";
import { getReviewPoolSize, getReviewQueue } from "@/data/quizzes";
import { QuizCard } from "@/components/quiz-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLearningStore } from "@/stores/learning-store";

export function ReviewPracticePanel() {
  const [index, setIndex] = useState(0);
  const reviewMistakes = useLearningStore((state) => state.reviewMistakes);
  const difficultWords = useLearningStore((state) => state.difficultWords.length);
  const recordQuizResult = useLearningStore((state) => state.recordQuizResult);
  const logDailyProgress = useLearningStore((state) => state.logDailyProgress);

  const queue = useMemo(() => getReviewQueue(reviewMistakes, 120), [reviewMistakes]);
  const quiz = queue[index % Math.max(queue.length, 1)];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">待复习错题</p>
          <p className="mt-2 text-4xl font-black text-ink" data-testid="review-mistake-count">
            {reviewMistakes.length}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">难词回顾</p>
          <p className="mt-2 text-4xl font-black text-ink">{difficultWords}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">挑战题池</p>
          <p className="mt-2 text-4xl font-black text-ink">{getReviewPoolSize()}</p>
        </Card>
      </div>

      {quiz ? (
        <QuizCard
          quiz={quiz}
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
      ) : (
        <Card>
          <p className="text-base text-slate-600">当前没有可用的复习题，请先完成一些学习内容。</p>
        </Card>
      )}

      <div className="flex justify-end">
        <Button type="button" variant="secondary" onClick={() => setIndex((current) => current + 1)}>
          下一题
        </Button>
      </div>
    </div>
  );
}
