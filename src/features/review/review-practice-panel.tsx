"use client";

import { useEffect, useMemo } from "react";
import { QuizCard } from "@/components/quiz-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getReviewPoolSize, getReviewQueue } from "@/data/quizzes";
import { createEmptyQuizSession } from "@/lib/quiz-session";
import { useLearningStore } from "@/stores/learning-store";

function getWrappedIndex(index: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  if (index >= total) {
    return total - 1;
  }

  if (index < 0) {
    return total - 1;
  }

  return index;
}

export function ReviewPracticePanel() {
  const hydrated = useLearningStore((state) => state.hydrated);
  const activeMode = useLearningStore((state) => state.modeConfig.activeMode);
  const reviewMistakes = useLearningStore((state) => state.reviewMistakes);
  const resolveReviewResult = useLearningStore((state) => state.resolveReviewResult);
  const logDailyProgress = useLearningStore((state) => state.logDailyProgress);
  const reviewSession = useLearningStore((state) => state.reviewSession);
  const updateReviewSession = useLearningStore((state) => state.updateReviewSession);
  const updateReviewQuizSession = useLearningStore((state) => state.updateReviewQuizSession);
  const clearReviewMistakes = useLearningStore((state) => state.clearReviewMistakes);

  const queue = useMemo(() => getReviewQueue(reviewMistakes, 120, activeMode), [activeMode, reviewMistakes]);
  const currentIndex = getWrappedIndex(reviewSession.index, queue.length);
  const currentEntry = queue[currentIndex] ?? null;
  const quiz = currentEntry?.quiz ?? null;

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (reviewSession.index !== currentIndex) {
      updateReviewSession(currentIndex);
    }
  }, [currentIndex, hydrated, reviewSession.index, updateReviewSession]);

  const goPrevious = () => {
    if (!queue.length) {
      return;
    }

    updateReviewSession(currentIndex - 1 < 0 ? queue.length - 1 : currentIndex - 1);
    updateReviewQuizSession(createEmptyQuizSession());
  };

  const goNext = () => {
    if (!queue.length) {
      return;
    }

    updateReviewSession((currentIndex + 1) % queue.length);
    updateReviewQuizSession(createEmptyQuizSession());
  };

  const confirmClearReviewPool = () => {
    if (typeof window === "undefined") {
      return;
    }

    const confirmed = window.confirm("清空后不可恢复，仅清空复习池，不影响基础题库。是否继续？");
    if (!confirmed) {
      return;
    }

    clearReviewMistakes();
  };

  if (!hydrated) {
    return <div className="py-10 text-sm text-slate-500">加载学习进度中...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-500" data-testid="review-mistake-count">
            {queue.length ? `${currentIndex + 1} / ${queue.length}` : `0 / ${getReviewPoolSize(reviewMistakes)}`}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-9 min-w-9 px-3"
              onClick={goPrevious}
              disabled={!quiz}
            >
              {"<"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-9 min-w-9 px-3"
              onClick={goNext}
              disabled={!quiz}
              data-testid="review-next-button"
            >
              {">"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-9 px-3"
              onClick={confirmClearReviewPool}
              data-testid="review-clear-button"
            >
              清空全部
            </Button>
          </div>
        </div>
      </Card>

      {quiz ? (
        <QuizCard
          quiz={quiz}
          autoAdvance="correct"
          sessionState={reviewSession.quiz}
          onSessionStateChange={updateReviewQuizSession}
          onAdvance={(correct) => {
            if (!correct || !queue.length) {
              return;
            }

            const nextIndex = Math.min(currentIndex, Math.max(queue.length - 2, 0));
            updateReviewSession(nextIndex);
            updateReviewQuizSession(createEmptyQuizSession());
          }}
          onResult={(correct) => {
            if (currentEntry) {
              resolveReviewResult(currentEntry.event.id, quiz.id, correct);
            }

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
        <Card className="flex min-h-[220px] items-center justify-center">
          <div className="space-y-2 text-center">
            <p className="text-base font-semibold text-slate-600">复习池已清空</p>
            <p className="text-sm text-slate-500">基础模块后续产生的新错题会立即进入这里。</p>
          </div>
        </Card>
      )}
    </div>
  );
}
