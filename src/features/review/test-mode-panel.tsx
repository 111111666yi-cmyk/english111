"use client";

import { useEffect, useMemo } from "react";
import { QuizCard } from "@/components/quiz-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSentenceQuiz, getVocabularyQuiz } from "@/data/quizzes";
import { createEmptyQuizSession } from "@/lib/quiz-session";
import { sentences, words } from "@/lib/content";
import { useLearningStore } from "@/stores/learning-store";

const totalTestQuestions = words.length + sentences.length;

function wrapIndex(index: number) {
  if (totalTestQuestions <= 0) {
    return 0;
  }

  if (index >= totalTestQuestions) {
    return totalTestQuestions - 1;
  }

  if (index < 0) {
    return 0;
  }

  return index;
}

export function TestModePanel() {
  const hydrated = useLearningStore((state) => state.hydrated);
  const activeMode = useLearningStore((state) => state.modeConfig.activeMode);
  const recordQuizResult = useLearningStore((state) => state.recordQuizResult);
  const logDailyProgress = useLearningStore((state) => state.logDailyProgress);
  const testSession = useLearningStore((state) => state.testSession);
  const updateTestSession = useLearningStore((state) => state.updateTestSession);
  const updateTestQuizSession = useLearningStore((state) => state.updateTestQuizSession);

  const currentIndex = wrapIndex(testSession.index);
  const quiz = useMemo(() => {
    if (currentIndex < words.length) {
      return getVocabularyQuiz(currentIndex, activeMode);
    }

    return getSentenceQuiz(currentIndex - words.length);
  }, [activeMode, currentIndex]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (currentIndex !== testSession.index) {
      updateTestSession(currentIndex);
    }
  }, [currentIndex, hydrated, testSession.index, updateTestSession]);

  const goPrevious = () => {
    updateTestSession(currentIndex - 1 < 0 ? totalTestQuestions - 1 : currentIndex - 1);
    updateTestQuizSession(createEmptyQuizSession());
  };

  const goNext = () => {
    updateTestSession(currentIndex + 1 >= totalTestQuestions ? 0 : currentIndex + 1);
    updateTestQuizSession(createEmptyQuizSession());
  };

  if (!hydrated) {
    return <div className="py-10 text-sm text-slate-500">加载学习进度中...</div>;
  }

  return (
    <div className="space-y-4" data-testid="test-mode-panel">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-500" data-testid="test-current-index">
            {`${currentIndex + 1} / ${totalTestQuestions}`}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-9 min-w-9 px-3"
              onClick={goPrevious}
              data-testid="test-prev-button"
            >
              {"<"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-9 min-w-9 px-3"
              onClick={goNext}
              data-testid="test-next-button"
            >
              {">"}
            </Button>
          </div>
        </div>
      </Card>

      <QuizCard
        quiz={quiz}
        variant="test"
        autoAdvance="correct"
        sessionState={testSession.quiz}
        onSessionStateChange={updateTestQuizSession}
        onAdvance={() => goNext()}
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
    </div>
  );
}
