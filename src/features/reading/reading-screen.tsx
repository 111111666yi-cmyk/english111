"use client";

import { useMemo } from "react";
import { PassageViewer } from "@/components/passage-viewer";
import { QuizCard } from "@/components/quiz-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shell } from "@/components/shell";
import { passages } from "@/lib/content";
import { cn } from "@/lib/utils";
import { useLearningStore } from "@/stores/learning-store";

const PASSAGE_PAGE_SIZE = 24;

export function ReadingScreen() {
  const hydrated = useLearningStore((state) => state.hydrated);
  const session = useLearningStore((state) => state.readingSession);
  const chineseAssist = useLearningStore((state) => state.settings.chineseAssist);
  const updateSetting = useLearningStore((state) => state.updateSetting);
  const completePassage = useLearningStore((state) => state.completePassage);
  const completedPassageIds = useLearningStore((state) => state.completedPassageIds);
  const logDailyProgress = useLearningStore((state) => state.logDailyProgress);
  const recordQuizResult = useLearningStore((state) => state.recordQuizResult);
  const updateReadingSession = useLearningStore((state) => state.updateReadingSession);
  const updateReadingQuizSession = useLearningStore((state) => state.updateReadingQuizSession);

  const currentIndex = passages.length ? Math.min(session.currentIndex, passages.length - 1) : 0;
  const passage = passages[currentIndex] ?? passages[0];
  const isCompleted = completedPassageIds.includes(passage.id);
  const completionCount = completedPassageIds.length;
  const remainingCount = Math.max(passages.length - completionCount, 0);
  const totalPages = Math.max(1, Math.ceil(passages.length / PASSAGE_PAGE_SIZE));
  const directoryPage = Math.min(session.directoryPage, totalPages - 1);
  const activeQuestionIndex = Math.min(session.activeQuestionIndex, Math.max(passage.questions.length - 1, 0));
  const currentQuestion = passage.questions[activeQuestionIndex] ?? null;

  const visiblePassages = useMemo(() => {
    const start = directoryPage * PASSAGE_PAGE_SIZE;
    return passages.slice(start, start + PASSAGE_PAGE_SIZE);
  }, [directoryPage]);

  const goNextPassage = (feedback = "") => {
    const nextIndex = currentIndex + 1 >= passages.length ? 0 : currentIndex + 1;
    updateReadingSession({
      currentIndex: nextIndex,
      directoryPage: Math.floor(nextIndex / PASSAGE_PAGE_SIZE),
      feedback,
      activeQuestionIndex: 0
    });
  };

  const goPreviousPassage = () => {
    const previousIndex = currentIndex - 1 < 0 ? passages.length - 1 : currentIndex - 1;
    updateReadingSession({
      currentIndex: previousIndex,
      directoryPage: Math.floor(previousIndex / PASSAGE_PAGE_SIZE),
      feedback: "",
      activeQuestionIndex: 0
    });
  };

  if (!hydrated) {
    return (
      <Shell>
        <div className="py-10 text-sm text-slate-500">加载学习进度中...</div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-4">
        <Card className="rounded-[1.5rem] p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-500">
              <span>
                篇目 {currentIndex + 1}/{passages.length}
              </span>
              <span>
                题目 {activeQuestionIndex + 1}/{passage.questions.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" className="h-9 min-w-9 px-3" onClick={goPreviousPassage}>
                {"<"}
              </Button>
              <Button type="button" variant="secondary" className="h-9 min-w-9 px-3" onClick={() => goNextPassage()}>
                {">"}
              </Button>
            </div>
          </div>
        </Card>

        <PassageViewer
          passage={passage}
          chineseAssist={chineseAssist}
          isCompleted={isCompleted}
          onToggleChinese={() => updateSetting("chineseAssist", !chineseAssist)}
          onComplete={() => {
            if (!isCompleted) {
              completePassage(passage.id);
              logDailyProgress({
                words: 0,
                sentences: 0,
                passages: 1,
                reviews: 0,
                correct: 1,
                total: 1
              });
            }

            goNextPassage(`已完成《${passage.title}》，继续下一篇。`);
          }}
        />

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span>{passage.level}</span>
              <span>{passage.topic}</span>
              <span data-testid="reading-completion-count">
                {completionCount}/{passages.length}
              </span>
              <span>剩余 {remainingCount}</span>
            </div>
            {session.feedback ? (
              <p className="text-sm font-medium text-surge" data-testid="reading-feedback">
                {session.feedback}
              </p>
            ) : null}
          </div>
        </Card>

        {currentQuestion ? (
          <QuizCard
            key={currentQuestion.id}
            quiz={currentQuestion}
            autoAdvance="correct"
            sessionState={session.quizzes[currentQuestion.id]}
            onSessionStateChange={(next) => updateReadingQuizSession(currentQuestion.id, next)}
            onAdvance={(correct) => {
              if (!correct) {
                return;
              }

              const nextQuestionIndex = activeQuestionIndex + 1;
              if (nextQuestionIndex < passage.questions.length) {
                updateReadingSession({
                  activeQuestionIndex: nextQuestionIndex,
                  feedback: ""
                });
                return;
              }

              if (!isCompleted) {
                completePassage(passage.id);
                logDailyProgress({
                  words: 0,
                  sentences: 0,
                  passages: 1,
                  reviews: 0,
                  correct: 1,
                  total: 1
                });
              }

              goNextPassage(`《${passage.title}》已完成，继续下一篇。`);
            }}
            onResult={(correct) => recordQuizResult(currentQuestion.id, correct)}
          />
        ) : (
          <Card>
            <p className="text-sm text-slate-500">当前短文没有可用题目。</p>
          </Card>
        )}

        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={() => goNextPassage()}>
            下一篇
          </Button>
        </div>

        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span>目录</span>
              <span>
                {directoryPage + 1}/{totalPages}
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={directoryPage === 0}
                onClick={() => updateReadingSession({ directoryPage: Math.max(directoryPage - 1, 0) })}
              >
                上一页
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={directoryPage + 1 >= totalPages}
                onClick={() => updateReadingSession({ directoryPage: Math.min(directoryPage + 1, totalPages - 1) })}
              >
                下一页
              </Button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {visiblePassages.map((item) => {
              const itemIndex = passages.findIndex((entry) => entry.id === item.id);
              const completed = completedPassageIds.includes(item.id);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    updateReadingSession({
                      currentIndex: itemIndex,
                      directoryPage,
                      feedback: "",
                      activeQuestionIndex: 0
                    })
                  }
                  data-testid="reading-directory-item"
                  data-passage-id={item.id}
                  className={cn(
                    "rounded-3xl border bg-white px-4 py-4 text-left transition hover:border-surge/40",
                    currentIndex === itemIndex && "border-surge bg-sky/10",
                    completed && "border-emerald-200"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-bold text-ink">{item.title}</p>
                    <span className="text-xs font-semibold text-slate-500">{item.level}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{item.topic}</p>
                  <p className="mt-3 text-xs text-slate-400">{completed ? "已完成" : "未完成"}</p>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </Shell>
  );
}
