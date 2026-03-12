"use client";

import { useEffect, useMemo } from "react";
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
  const reviewMistakes = useLearningStore((state) => state.reviewMistakes.length);
  const recordQuizResult = useLearningStore((state) => state.recordQuizResult);
  const logDailyProgress = useLearningStore((state) => state.logDailyProgress);
  const testSession = useLearningStore((state) => state.testSession);
  const updateTestSession = useLearningStore((state) => state.updateTestSession);
  const resetTestSession = useLearningStore((state) => state.resetTestSession);

  const currentIndex = wrapIndex(testSession.index);
  const quiz = useMemo(() => getTestQuiz(currentIndex), [currentIndex]);
  const currentBucket = currentIndex < words.length ? "单词测试" : "句子测试";

  useEffect(() => {
    if (currentIndex !== testSession.index) {
      updateTestSession(currentIndex);
    }
  }, [currentIndex, testSession.index, updateTestSession]);

  const goPrevious = () => {
    updateTestSession(
      currentIndex - 1 < 0 ? totalTestQuestions - 1 : currentIndex - 1
    );
  };

  const goNext = () => {
    updateTestSession(
      currentIndex + 1 >= totalTestQuestions ? 0 : currentIndex + 1
    );
  };

  return (
    <div className="space-y-6" data-testid="test-mode-panel">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <p className="text-sm text-slate-500">当前题号</p>
          <p
            className="mt-2 text-4xl font-black text-ink"
            data-testid="test-current-index"
          >
            {currentIndex + 1} / {totalTestQuestions}
          </p>
          <p className="mt-2 text-sm text-slate-500">{currentBucket}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">测试覆盖</p>
          <p className="mt-2 text-4xl font-black text-ink">{totalTestQuestions}</p>
          <p className="mt-2 text-sm text-slate-500">
            只包含单词和句子，不并入短文。
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">已入复习池</p>
          <p className="mt-2 text-4xl font-black text-ink">{reviewMistakes}</p>
          <p className="mt-2 text-sm text-slate-500">
            测试做错后会直接进入复习模块。
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">本地进度</p>
          <p className="mt-2 text-4xl font-black text-ink">已保存</p>
          <p className="mt-2 text-sm text-slate-500">
            切换到别的页面再回来，也会从当前题继续。
          </p>
        </Card>
      </div>

      <Card className="space-y-3 bg-white/80">
        <p className="text-base font-semibold text-ink">测试模式说明</p>
        <p className="text-sm leading-6 text-slate-500">
          这里不显示重点词和额外提示，但 fill-blank 会保留整句中文翻译，帮助根据句意猜测缺失单词。回答正确后会自动进入下一题，回答错误会先留在当前题，方便你检查。
        </p>
      </Card>

      <QuizCard
        quiz={quiz}
        variant="test"
        autoAdvance="correct"
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

      <div className="flex flex-wrap justify-between gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={goPrevious}
          data-testid="test-prev-button"
        >
          上一题
        </Button>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={goNext}
            data-testid="test-next-button"
          >
            下一题
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={resetTestSession}
            data-testid="test-reset-button"
          >
            重新开始
          </Button>
        </div>
      </div>
    </div>
  );
}
