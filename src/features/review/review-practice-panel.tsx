"use client";

import { useEffect, useMemo } from "react";
import { getReviewPoolSize, getReviewQueue } from "@/data/quizzes";
import { QuizCard } from "@/components/quiz-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLearningStore } from "@/stores/learning-store";

function getWrappedIndex(index: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  if (index >= total) {
    return total - 1;
  }

  if (index < 0) {
    return 0;
  }

  return index;
}

export function ReviewPracticePanel() {
  const reviewMistakes = useLearningStore((state) => state.reviewMistakes);
  const difficultWords = useLearningStore((state) => state.difficultWords.length);
  const recordQuizResult = useLearningStore((state) => state.recordQuizResult);
  const logDailyProgress = useLearningStore((state) => state.logDailyProgress);
  const reviewSession = useLearningStore((state) => state.reviewSession);
  const updateReviewSession = useLearningStore((state) => state.updateReviewSession);

  const queue = useMemo(() => getReviewQueue(reviewMistakes, 120), [reviewMistakes]);
  const currentIndex = getWrappedIndex(reviewSession.index, queue.length);
  const quiz = queue[currentIndex];

  useEffect(() => {
    if (reviewSession.index !== currentIndex) {
      updateReviewSession(currentIndex);
    }
  }, [currentIndex, reviewSession.index, updateReviewSession]);

  const goNext = () => {
    if (!queue.length) {
      return;
    }

    updateReviewSession((currentIndex + 1) % queue.length);
  };

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
          autoAdvance="correct"
          onAdvance={(correct) => {
            if (!correct || !queue.length) {
              return;
            }

            const wasTrackedMistake = reviewMistakes.includes(quiz.id);
            const nextIndex = wasTrackedMistake
              ? Math.min(currentIndex, Math.max(queue.length - 2, 0))
              : (currentIndex + 1) % queue.length;

            updateReviewSession(nextIndex);
          }}
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
          <p className="text-base text-slate-600">
            当前没有可用的复习题，请先完成一些学习内容。
          </p>
        </Card>
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={goNext}
          disabled={!quiz}
          data-testid="review-next-button"
        >
          下一题
        </Button>
      </div>
    </div>
  );
}
