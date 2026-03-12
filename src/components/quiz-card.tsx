"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AudioButton } from "@/components/audio-button";
import { ResultToast } from "@/components/result-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
}

function normalizeAnswer(answer: QuizItem["answer"]) {
  if (Array.isArray(answer)) {
    return answer.map((item) => item.trim().toLowerCase()).sort();
  }

  return String(answer).trim().toLowerCase();
}

function isAnswerEqual(
  expected: ReturnType<typeof normalizeAnswer>,
  candidate: string | string[]
) {
  if (Array.isArray(expected) && Array.isArray(candidate)) {
    return JSON.stringify(expected) === JSON.stringify(candidate.slice().sort());
  }

  return expected === candidate;
}

export function QuizCard({
  quiz,
  onResult,
  onAdvance,
  variant = "study",
  autoAdvance = "off",
  advanceDelayMs = 900
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
  const showFillBlankTranslation =
    quiz.type === "fill-blank" && Boolean(quiz.promptSupplementZh);
  const displayAnswer = useMemo(() => resolveQuizAnswerText(quiz), [quiz]);
  const hasReadingOptionTranslations =
    quiz.type === "reading-question" &&
    Boolean(quiz.options?.some((option) => option.detail || option.translationZh));

  useEffect(() => {
    if (autoAdvanceTimer.current !== null) {
      window.clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }

    setSelected("");
    setTextAnswer("");
    setReorderAnswer([]);
    setMatchedPairs([]);
    setActiveLeft("");
    setFeedback({ visible: false, correct: false });
  }, [quiz.id]);

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

    const shouldAdvance =
      autoAdvance === "always" || (autoAdvance === "correct" && correct);

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
    if (feedback.visible) {
      return;
    }

    const expected = normalizeAnswer(quiz.answer);
    const candidate =
      quiz.type === "fill-blank"
        ? textAnswer.trim().toLowerCase()
        : quiz.type === "reorder"
          ? reorderAnswer.join(" ").trim().toLowerCase()
          : quiz.type === "match"
            ? matchedPairs.slice().sort()
            : selected.trim().toLowerCase();

    const correct = isAnswerEqual(expected, candidate);

    setFeedback({ visible: true, correct });
    onResult?.(correct);
    queueAdvance(correct);
  };

  const canSubmit =
    quiz.type === "fill-blank"
      ? Boolean(textAnswer.trim())
      : quiz.type === "reorder"
        ? reorderAnswer.length > 0
        : quiz.type === "match"
          ? matchedPairs.length > 0
          : Boolean(selected);

  return (
    <Card className="space-y-5" data-testid="quiz-card" data-quiz-id={quiz.id}>
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
          <div
            className="rounded-3xl bg-sky/10 p-4"
            data-testid="quiz-fill-blank-translation"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              完整句子翻译
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

      {quiz.type === "fill-blank" ? (
        <input
          value={textAnswer}
          onChange={(event) => setTextAnswer(event.target.value)}
          className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-base outline-none transition focus:border-surge"
          placeholder="输入英文答案"
          data-testid="quiz-fill-blank-input"
        />
      ) : quiz.type === "reorder" ? (
        <div className="space-y-4">
          <div className="rounded-3xl border border-dashed border-surge/40 bg-sky/5 p-4">
            <p className="text-sm text-slate-500">当前顺序</p>
            <p className="mt-2 min-h-7 text-base font-semibold text-ink">
              {reorderAnswer.length ? reorderAnswer.join(" ") : "点击下方词块组成答案"}
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
                  onClick={() => setReorderAnswer((current) => [...current, option.label])}
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
              onClick={() => setReorderAnswer((current) => current.slice(0, -1))}
            >
              撤销一步
            </Button>
            <Button type="button" variant="ghost" onClick={() => setReorderAnswer([])}>
              清空
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
                onClick={() => setActiveLeft(pair.left)}
                data-testid="quiz-match-left"
                className={cn(
                  "w-full rounded-3xl border px-4 py-3 text-left transition",
                  activeLeft === pair.left
                    ? "border-surge bg-sky/10"
                    : "border-slate-200 bg-white"
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
                  setMatchedPairs((current) =>
                    current
                      .filter((item) => !item.startsWith(`${activeLeft}:`))
                      .concat(composed)
                  );
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
              {matchedPairs.length ? matchedPairs.join(" / ") : "先点左侧英文，再点右侧中文。"}
            </div>
            <Button type="button" variant="ghost" onClick={() => setMatchedPairs([])}>
              清空配对
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {quiz.options?.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setSelected(option.id)}
              data-testid="quiz-option"
              data-option-id={option.id}
              className={cn(
                "rounded-3xl border px-4 py-3 text-left transition",
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
        <div className="text-sm text-slate-500">
          {showStudySupport && quiz.relatedWords.length
            ? `重点词汇：${quiz.relatedWords.join(" / ")}`
            : "完成本题后可以继续前进。"}
        </div>
        <Button type="button" onClick={submit} disabled={!canSubmit} data-testid="quiz-submit">
          提交答案
        </Button>
      </div>

      {feedback.visible ? (
        <div className="space-y-3 rounded-3xl bg-slate-50 p-4" data-testid="quiz-feedback">
          <ResultToast
            visible={feedback.visible}
            correct={feedback.correct}
            text={
              feedback.correct
                ? "回答正确，继续下一题。"
                : "这题先记下来，稍后再复习。"
            }
          />
          <p className="text-sm text-slate-600">
            正确答案：<span className="font-semibold text-ink">{displayAnswer}</span>
          </p>
          <p className="text-sm leading-6 text-slate-500">{quiz.explanation}</p>
          {hasReadingOptionTranslations ? (
            <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-100">
              <p className="text-sm font-semibold text-ink">选项翻译</p>
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
