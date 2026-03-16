"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AudioButton } from "@/components/audio-button";
import { ResultToast } from "@/components/result-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createEmptyQuizSession, normalizeQuizSession, type QuizSessionState } from "@/lib/quiz-session";
import { resolveQuizAnswerText } from "@/lib/quiz-support";
import { cn } from "@/lib/utils";
import type { QuizItem } from "@/types/content";

interface QuizCardProps {
  quiz: QuizItem;
  onResult?: (correct: boolean) => void;
  onAdvance?: (correct: boolean) => void;
  variant?: "study" | "test" | "challenge";
  autoAdvance?: "off" | "correct" | "always";
  advanceDelayMs?: number;
  sessionState?: QuizSessionState;
  onSessionStateChange?: (state: QuizSessionState) => void;
  compact?: boolean;
  hideHeader?: boolean;
}

function normalizeToken(value: string) {
  return value.trim().toLowerCase();
}

function normalizeScalarAnswer(answer: QuizItem["answer"]) {
  return normalizeToken(String(answer));
}

function normalizeStrictSequence(answer: QuizItem["answer"]) {
  if (Array.isArray(answer)) {
    return answer.map((item) => normalizeToken(item));
  }

  return String(answer)
    .split(/\s+/)
    .map((item) => normalizeToken(item))
    .filter(Boolean);
}

function normalizeSortedSequence(answer: QuizItem["answer"]) {
  if (Array.isArray(answer)) {
    return answer.map((item) => normalizeToken(item)).sort();
  }

  return [normalizeToken(String(answer))];
}

function isScalarAnswerEqual(expected: QuizItem["answer"], candidate: string) {
  return normalizeScalarAnswer(expected) === normalizeToken(candidate);
}

function isStrictSequenceEqual(expected: QuizItem["answer"], candidate: string[]) {
  const expectedSequence = normalizeStrictSequence(expected);
  const candidateSequence = candidate.map((item) => normalizeToken(item)).filter(Boolean);

  return JSON.stringify(expectedSequence) === JSON.stringify(candidateSequence);
}

function isSortedSequenceEqual(expected: QuizItem["answer"], candidate: string[]) {
  const expectedSequence = normalizeSortedSequence(expected);
  const candidateSequence = candidate.map((item) => normalizeToken(item)).sort();

  return JSON.stringify(expectedSequence) === JSON.stringify(candidateSequence);
}

export function QuizCard({
  quiz,
  onResult,
  onAdvance,
  variant = "study",
  autoAdvance = "off",
  advanceDelayMs = 900,
  sessionState,
  onSessionStateChange,
  compact = false,
  hideHeader = false
}: QuizCardProps) {
  const [selected, setSelected] = useState("");
  const [textAnswer, setTextAnswer] = useState("");
  const [reorderAnswer, setReorderAnswer] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [activeLeft, setActiveLeft] = useState("");
  const [feedback, setFeedback] = useState<{ visible: boolean; correct: boolean }>({
    visible: false,
    correct: false
  });
  const autoAdvanceTimer = useRef<number | null>(null);

  const showStudySupport = variant === "study";
  const isErrorCard = quiz.type === "error";
  const showFillBlankTranslation = quiz.type === "fill-blank" && Boolean(quiz.promptSupplementZh);
  const displayAnswer = useMemo(() => resolveQuizAnswerText(quiz), [quiz]);
  const hasReadingOptionTranslations =
    quiz.type === "reading-question" &&
    Boolean(quiz.options?.some((option) => option.detail || option.translationZh));

  const syncSession = (patch: Partial<QuizSessionState>) => {
    if (!onSessionStateChange) {
      return;
    }

    const base = normalizeQuizSession(
      sessionState?.quizId === quiz.id ? sessionState : createEmptyQuizSession(quiz.id),
      quiz.id
    );

    onSessionStateChange(
      normalizeQuizSession(
        {
          ...base,
          ...patch,
          quizId: quiz.id
        },
        quiz.id
      )
    );
  };

  useEffect(() => {
    const nextState =
      sessionState?.quizId === quiz.id
        ? normalizeQuizSession(sessionState, quiz.id)
        : createEmptyQuizSession(quiz.id);

    setSelected(nextState.selected);
    setTextAnswer(nextState.textAnswer);
    setReorderAnswer(nextState.reorderAnswer);
    setMatchedPairs(nextState.matchedPairs);
    setActiveLeft(nextState.activeLeft);
    setFeedback({
      visible: nextState.feedbackVisible,
      correct: nextState.feedbackCorrect
    });

    if (sessionState?.quizId !== quiz.id && onSessionStateChange) {
      onSessionStateChange(nextState);
    }
  }, [onSessionStateChange, quiz.id, sessionState]);

  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current !== null) {
        window.clearTimeout(autoAdvanceTimer.current);
      }
    };
  }, []);

  const queueAdvance = (correct: boolean) => {
    if (!onAdvance) {
      return;
    }

    const shouldAdvance = autoAdvance === "always" || (autoAdvance === "correct" && correct);

    if (!shouldAdvance) {
      return;
    }

    if (autoAdvanceTimer.current !== null) {
      window.clearTimeout(autoAdvanceTimer.current);
    }

    autoAdvanceTimer.current = window.setTimeout(() => {
      onAdvance(correct);
      autoAdvanceTimer.current = null;
    }, advanceDelayMs);
  };

  const submit = () => {
    if (feedback.visible || isErrorCard) {
      return;
    }

    const correct =
      quiz.type === "fill-blank"
        ? isScalarAnswerEqual(quiz.answer, textAnswer)
        : quiz.type === "reorder"
          ? isStrictSequenceEqual(quiz.answer, reorderAnswer)
          : quiz.type === "match"
            ? isSortedSequenceEqual(quiz.answer, matchedPairs)
            : isScalarAnswerEqual(quiz.answer, selected);

    setFeedback({ visible: true, correct });
    syncSession({ feedbackVisible: true, feedbackCorrect: correct });
    onResult?.(correct);
    queueAdvance(correct);
  };

  const canSubmit = isErrorCard
    ? false
    : quiz.type === "fill-blank"
      ? Boolean(textAnswer.trim())
      : quiz.type === "reorder"
        ? reorderAnswer.length > 0
        : quiz.type === "match"
          ? matchedPairs.length > 0
          : Boolean(selected);

  return (
    <Card
      className={cn("space-y-5", compact && "space-y-4 rounded-[1.75rem] p-4")}
      data-testid="quiz-card"
      data-quiz-id={quiz.id}
    >
      {!hideHeader ? (
        <div
          className={cn(
            "grid gap-4",
            showFillBlankTranslation &&
              "md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:items-start"
          )}
        >
          <div className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge className="bg-sky/10 text-surge">{quiz.type}</Badge>
                <h3 className="mt-3 text-xl font-bold text-ink" data-testid="quiz-prompt">
                  {quiz.prompt}
                </h3>
                {showStudySupport && quiz.promptZh ? (
                  <p className="mt-2 text-sm text-slate-500">{quiz.promptZh}</p>
                ) : null}
                {showStudySupport && !showFillBlankTranslation && quiz.promptSupplementZh ? (
                  <p className="mt-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
                    {quiz.promptSupplementZh}
                  </p>
                ) : null}
              </div>

              {!showFillBlankTranslation && showStudySupport && quiz.audioRef ? (
                <AudioButton audioRef={quiz.audioRef} />
              ) : null}
            </div>
          </div>

          {showFillBlankTranslation ? (
            <div className="rounded-3xl bg-sky/10 p-4" data-testid="quiz-fill-blank-translation">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                Translation
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-700 md:text-base">
                {quiz.promptSupplementZh}
              </p>
              {showStudySupport && quiz.audioRef ? (
                <AudioButton className="mt-4" audioRef={quiz.audioRef} />
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {isErrorCard ? (
        <div
          className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
          data-testid="quiz-error-state"
        >
          <p className="font-semibold">This quiz item is temporarily unavailable.</p>
          <p className="mt-2">It will not be counted for scoring or mistake tracking.</p>
          {quiz.errorMessage ? (
            <p className="mt-2 break-all text-xs text-amber-800/80">Source: {quiz.errorMessage}</p>
          ) : null}
        </div>
      ) : quiz.type === "fill-blank" ? (
        <input
          value={textAnswer}
          onChange={(event) => {
            const value = event.target.value;
            setTextAnswer(value);
            syncSession({ textAnswer: value });
          }}
          className={cn(
            "w-full rounded-3xl border border-slate-200 bg-white px-4 text-base outline-none transition focus:border-surge",
            compact ? "py-2.5" : "py-3"
          )}
          placeholder="Type the missing word"
          data-testid="quiz-fill-blank-input"
        />
      ) : quiz.type === "reorder" ? (
        <div className="space-y-4">
          <div className="rounded-3xl border border-dashed border-surge/40 bg-sky/5 p-4">
            <p className="text-sm text-slate-500">Current order</p>
            <p className="mt-2 min-h-7 text-base font-semibold text-ink">
              {reorderAnswer.length ? reorderAnswer.join(" ") : "Tap the chips below to build the answer"}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {quiz.options?.map((option) => {
              const used = reorderAnswer.includes(option.label);

              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={used}
                  onClick={() =>
                    setReorderAnswer((current) => {
                      const next = [...current, option.label];
                      syncSession({ reorderAnswer: next });
                      return next;
                    })
                  }
                  data-testid="quiz-reorder-option"
                  data-option-id={option.id}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-surge/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setReorderAnswer((current) => {
                  const next = current.slice(0, -1);
                  syncSession({ reorderAnswer: next });
                  return next;
                })
              }
            >
              Undo
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setReorderAnswer([]);
                syncSession({ reorderAnswer: [] });
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      ) : quiz.type === "match" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            {quiz.meta?.pairs?.map((pair) => (
              <button
                key={pair.left}
                type="button"
                onClick={() => {
                  setActiveLeft(pair.left);
                  syncSession({ activeLeft: pair.left });
                }}
                data-testid="quiz-match-left"
                className={cn(
                  "w-full rounded-3xl border px-4 py-3 text-left transition",
                  activeLeft === pair.left ? "border-surge bg-sky/10" : "border-slate-200 bg-white"
                )}
              >
                {pair.left}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {quiz.meta?.pairs?.map((pair) => (
              <button
                key={pair.right}
                type="button"
                onClick={() => {
                  if (!activeLeft) {
                    return;
                  }

                  const composed = `${activeLeft}:${pair.right}`;
                  setMatchedPairs((current) => {
                    const next = current.filter((item) => !item.startsWith(`${activeLeft}:`)).concat(composed);
                    syncSession({ matchedPairs: next, activeLeft: "" });
                    return next;
                  });
                  setActiveLeft("");
                }}
                data-testid="quiz-match-right"
                className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-surge/40"
              >
                {pair.right}
              </button>
            ))}
          </div>
          <div className="space-y-3 md:col-span-2">
            <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-500">
              Current pairs: {matchedPairs.length ? matchedPairs.join(" / ") : "Pick English first, then Chinese."}
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setMatchedPairs([]);
                setActiveLeft("");
                syncSession({ matchedPairs: [], activeLeft: "" });
              }}
            >
              Clear pairs
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {quiz.options?.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setSelected(option.id);
                syncSession({ selected: option.id });
              }}
              data-testid="quiz-option"
              data-option-id={option.id}
              className={cn(
                "rounded-3xl border px-4 text-left transition",
                compact ? "py-2.5" : "py-3",
                selected === option.id
                  ? "border-surge bg-sky/10"
                  : "border-slate-200 bg-white hover:border-surge/40"
              )}
            >
              <p className="font-semibold text-ink">{option.label}</p>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {!compact ? (
          <div className="text-sm text-slate-500">
            {isErrorCard
              ? "This item is in error state and will not affect progress."
              : showStudySupport && quiz.relatedWords.length
                ? `Focus words: ${quiz.relatedWords.join(" / ")}`
                : "Submit and continue when you are ready."}
          </div>
        ) : (
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{quiz.type}</div>
        )}
        <Button type="button" onClick={submit} disabled={!canSubmit} data-testid="quiz-submit">
          Submit
        </Button>
      </div>

      {feedback.visible ? (
        <div className="space-y-3 rounded-3xl bg-slate-50 p-4" data-testid="quiz-feedback">
          <ResultToast
            visible={feedback.visible}
            correct={feedback.correct}
            text={feedback.correct ? "Correct. Moving on." : "Saved for review. Check the answer below."}
          />
          <p className="text-sm text-slate-600">
            Answer: <span className="font-semibold text-ink">{displayAnswer}</span>
          </p>
          <p className="text-sm leading-6 text-slate-500">{quiz.explanation}</p>
          {hasReadingOptionTranslations ? (
            <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-100">
              <p className="text-sm font-semibold text-ink">Option Notes</p>
              <div className="mt-3 space-y-3">
                {quiz.options?.map((option) => (
                  <div key={option.id} className="rounded-2xl bg-slate-50 px-3 py-3">
                    <p className="text-sm font-semibold text-ink">{option.label}</p>
                    {option.detail || option.translationZh ? (
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {option.detail ?? option.translationZh}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
