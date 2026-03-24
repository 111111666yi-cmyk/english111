"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AudioButton } from "@/components/audio-button";
import { ResultToast } from "@/components/result-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createEmptyQuizSession, normalizeQuizSession, type QuizSessionState } from "@/lib/quiz-session";
import { resolveQuizAnswerText } from "@/lib/quiz-support";
import { playUiSound } from "@/lib/ui-sound";
import { cn } from "@/lib/utils";
import { useLearningStore } from "@/stores/learning-store";
import { getChallengeQuizTypeLabel } from "@/features/challenge/challenge-ui";
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
  const soundTheme = useLearningStore((state) => state.settings.soundTheme);

  const showStudySupport = variant === "study";
  const isChallengeCard = variant === "challenge";
  const isErrorCard = quiz.type === "error";
  const showFillBlankTranslation = quiz.type === "fill-blank" && Boolean(quiz.promptSupplementZh);
  const displayAnswer = useMemo(() => resolveQuizAnswerText(quiz), [quiz]);
  const hasReadingOptionTranslations =
    quiz.type === "reading-question" &&
    Boolean(quiz.options?.some((option) => option.detail || option.translationZh));
  const quizTypeLabel = getChallengeQuizTypeLabel(quiz.type, quiz.meta?.mode);

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
    void playUiSound(soundTheme);
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
      className={cn(
        "space-y-5",
        compact && "space-y-4 rounded-[1.75rem] p-4",
        isChallengeCard && "overflow-hidden rounded-[1.9rem] border border-white/78 bg-[linear-gradient(145deg,rgba(255,255,255,0.97),rgba(248,250,252,0.88))] shadow-[0_20px_48px_rgba(148,163,184,0.16)]"
      )}
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
              <Badge className={cn("bg-sky/10 text-surge", isChallengeCard && "rounded-full border border-white/70 bg-white/82 px-3 py-1 text-[11px] font-bold shadow-[0_10px_22px_rgba(148,163,184,0.12)]")}>
                {quizTypeLabel}
              </Badge>
                <h3 className="mt-3 text-xl font-bold theme-primary-text" data-testid="quiz-prompt">
                  {quiz.prompt}
                </h3>
                {showStudySupport && quiz.promptZh ? (
                  <p className="mt-2 text-sm text-subtle-readable">{quiz.promptZh}</p>
                ) : null}
                {showStudySupport && !showFillBlankTranslation && quiz.promptSupplementZh ? (
                  <p className="mt-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm leading-6 text-muted-readable">
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
                参考释义
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
          <p className="font-semibold">这道题暂时不可用。</p>
          <p className="mt-2">它不会计入本关进度、成绩或错题记录。</p>
          {quiz.errorMessage ? (
            <p className="mt-2 break-all text-xs text-amber-800/80">异常来源：{quiz.errorMessage}</p>
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
          placeholder="请输入缺失单词"
          data-testid="quiz-fill-blank-input"
        />
      ) : quiz.type === "reorder" ? (
        <div className="space-y-4">
          <div className="rounded-3xl border border-dashed border-surge/40 bg-sky/5 p-4">
            <p className="text-sm text-slate-500">当前顺序</p>
            <p className="mt-2 min-h-7 text-base font-semibold text-ink">
              {reorderAnswer.length ? reorderAnswer.join(" ") : "点击下方词块，拼出正确答案"}
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
              撤回一步
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setReorderAnswer([]);
                syncSession({ reorderAnswer: [] });
              }}
            >
              清空答案
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
              当前配对：
              {matchedPairs.length ? matchedPairs.join(" / ") : "先选英文，再选中文。"}
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
              清空配对
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {quiz.options?.map((option) => (
            (() => {
              const isSelected = selected === option.id;
              const isCorrect = feedback.visible && option.id === String(quiz.answer);
              const isWrongSelected = feedback.visible && isSelected && !isCorrect;
              const radioState = isCorrect ? "correct" : isWrongSelected ? "wrong" : isSelected ? "selected" : "idle";

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    if (feedback.visible) {
                      return;
                    }
                    setSelected(option.id);
                    void playUiSound(soundTheme);
                    syncSession({ selected: option.id });
                  }}
                  disabled={feedback.visible}
                  data-testid="quiz-option"
                  data-option-id={option.id}
                  className={cn(
                    "rounded-3xl border px-4 text-left transition disabled:cursor-default disabled:opacity-100",
                    compact ? "py-2.5" : "py-3",
                    isCorrect
                      ? "border-emerald-500 bg-emerald-50"
                      : isWrongSelected
                        ? "border-red-400 bg-red-50"
                        : isSelected
                          ? "border-surge bg-sky/10"
                          : "border-slate-200 bg-white hover:border-surge/40"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="option-radio mt-0.5 shrink-0" data-state={radioState} aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{option.label}</p>
                      {feedback.visible ? (
                        <p className="mt-1 text-xs font-medium text-muted-readable">
                          {isCorrect ? "正确答案" : isWrongSelected ? "你的选择" : "未选择"}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })()
          ))}
        </div>
      )}

      <div className="space-y-3 rounded-[1.4rem] bg-slate-50/90 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {!compact ? (
            <div className="text-sm text-subtle-readable">
              <span className="font-semibold text-ink">{feedback.visible ? "已提交" : "未提交"}</span>
              {" · "}
              {isErrorCard
                ? "当前题目不计入进度。"
                : showStudySupport && quiz.relatedWords.length
                  ? `重点词：${quiz.relatedWords.join(" / ")}`
                  : "先选答案，再提交本题。"}
            </div>
          ) : (
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{quizTypeLabel}</div>
          )}
          {feedback.visible ? (
            <div
              className={cn(
                "rounded-full px-3 py-1 text-xs font-bold",
                feedback.correct ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
              )}
            >
              {feedback.correct ? "回答正确" : "回答错误"}
            </div>
          ) : null}
        </div>
        <Button
          type="button"
          onClick={submit}
          disabled={!canSubmit || feedback.visible}
          className={cn("w-full", isChallengeCard && "h-12 rounded-[1.25rem] text-sm font-bold")}
          data-testid="quiz-submit"
        >
          {feedback.visible ? "已提交" : "提交答案"}
        </Button>
      </div>

      {feedback.visible ? (
        <div className="space-y-3 rounded-3xl bg-slate-50 p-4" data-testid="quiz-feedback">
          <ResultToast
            visible={feedback.visible}
            correct={feedback.correct}
            text={feedback.correct ? "回答正确，继续下一题。" : "已加入错题库，请看解析。"}
          />
          <p className="text-sm text-muted-readable">
            正确答案：
            <span className="font-semibold text-ink">{displayAnswer}</span>
          </p>
          <p className="text-sm leading-6 text-subtle-readable">{quiz.explanation}</p>
          {hasReadingOptionTranslations ? (
            <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-100">
              <p className="text-sm font-semibold text-ink">选项说明</p>
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
