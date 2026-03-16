"use client";

import { AudioButton } from "@/components/audio-button";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { QuizCard } from "@/components/quiz-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shell } from "@/components/shell";
import { canGenerateExpressionQuiz, getExpressionQuiz } from "@/data/quizzes";
import { createEmptyQuizSession } from "@/lib/quiz-session";
import { expressions } from "@/lib/content";
import { useLearningStore } from "@/stores/learning-store";

export function ExpressionsScreen() {
  const hydrated = useLearningStore((state) => state.hydrated);
  const session = useLearningStore((state) => state.expressionsSession);
  const recordQuizResult = useLearningStore((state) => state.recordQuizResult);
  const updateExpressionsSession = useLearningStore((state) => state.updateExpressionsSession);
  const updateExpressionsQuizSession = useLearningStore((state) => state.updateExpressionsQuizSession);

  if (!hydrated) {
    return (
      <Shell>
        <div className="py-10 text-sm text-slate-500">加载学习进度中...</div>
      </Shell>
    );
  }

  const currentIndex = expressions.length ? Math.min(session.currentIndex, expressions.length - 1) : 0;
  const expression = expressions[currentIndex] ?? expressions[0];
  const canShowQuiz = canGenerateExpressionQuiz();
  const quiz = canShowQuiz ? getExpressionQuiz(currentIndex) : null;

  const goNext = () =>
    updateExpressionsSession({
      currentIndex: currentIndex + 1 >= expressions.length ? 0 : currentIndex + 1,
      quiz: createEmptyQuizSession()
    });

  const goPrevious = () =>
    updateExpressionsSession({
      currentIndex: currentIndex - 1 < 0 ? expressions.length - 1 : currentIndex - 1,
      quiz: createEmptyQuizSession()
    });

  return (
    <Shell>
      <div className="space-y-4">
        <Card className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <DifficultyBadge level={expression.level} />
                <span className="text-sm font-semibold text-slate-500">
                  {currentIndex + 1}/{expressions.length}
                </span>
              </div>
              <div>
                <p className="text-sm text-slate-500">基础表达</p>
                <h3 className="text-2xl font-bold text-slate-600">{expression.basic}</h3>
              </div>
              <div>
                <p className="text-sm text-slate-500">进阶表达</p>
                <h4 className="text-4xl font-black text-ink">{expression.advanced}</h4>
              </div>
              <p className="text-base text-slate-600">{expression.meaningZh}</p>
            </div>

            <div className="flex min-w-[124px] flex-col items-end gap-3">
              <AudioButton
                audioRef={{
                  kind: "expression",
                  cacheKey: `${expression.id}-basic`,
                  localPath: expression.audioLocalBasic,
                  text: expression.basic
                }}
                localLabel="基础表达"
                cloudLabel="基础表达云端发音"
              />
              <AudioButton
                audioRef={{
                  kind: "expression",
                  cacheKey: `${expression.id}-advanced`,
                  localPath: expression.audioLocalAdvanced,
                  text: expression.advanced
                }}
                localLabel="进阶表达"
                cloudLabel="进阶表达云端发音"
              />
              <div className="flex items-center gap-2">
                <Button type="button" variant="secondary" className="h-9 min-w-9 px-3" onClick={goPrevious}>
                  {"<"}
                </Button>
                <Button type="button" variant="secondary" className="h-9 min-w-9 px-3" onClick={goNext}>
                  {">"}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Basic</p>
              <p className="mt-3 text-base leading-7 text-ink">{expression.exampleBasic}</p>
            </div>
            <div className="rounded-3xl bg-sky/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Advanced</p>
              <p className="mt-3 text-base leading-7 text-ink">{expression.exampleAdvanced}</p>
            </div>
          </div>
        </Card>

        {quiz ? (
          <QuizCard
            quiz={quiz}
            autoAdvance="correct"
            sessionState={session.quiz}
            onSessionStateChange={updateExpressionsQuizSession}
            onAdvance={() => goNext()}
            onResult={(correct) => recordQuizResult(quiz.id, correct)}
          />
        ) : (
          <Card>
            <p className="text-sm text-slate-600">当前题库不足，暂不显示训练题。</p>
          </Card>
        )}

        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={() => goNext()}>
            下一组表达
          </Button>
        </div>
      </div>
    </Shell>
  );
}
