"use client";

import { useState } from "react";
import { AudioButton } from "@/components/audio-button";
import { getExpressionQuiz } from "@/data/quizzes";
import { QuizCard } from "@/components/quiz-card";
import { Shell } from "@/components/shell";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { expressions } from "@/lib/content";
import { useLearningStore } from "@/stores/learning-store";

export function ExpressionsScreen() {
  const [index, setIndex] = useState(0);
  const expression = expressions[index] ?? expressions[0];
  const quiz = getExpressionQuiz(index);
  const recordQuizResult = useLearningStore((state) => state.recordQuizResult);

  return (
    <Shell>
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Upgrade"
          title="进阶表达"
          description="从基础说法平滑过渡到更自然、更正式的表达方式。"
        />

        <Card className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <DifficultyBadge level={expression.level} />
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

            <div className="space-y-3">
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
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Basic
              </p>
              <p className="mt-3 text-base leading-7 text-ink">{expression.exampleBasic}</p>
            </div>
            <div className="rounded-3xl bg-sky/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                Advanced
              </p>
              <p className="mt-3 text-base leading-7 text-ink">{expression.exampleAdvanced}</p>
            </div>
          </div>

          <p className="rounded-3xl bg-white p-4 text-sm leading-7 text-slate-600 ring-1 ring-slate-100">
            {expression.noteZh}
          </p>
        </Card>

        <QuizCard quiz={quiz} onResult={(correct) => recordQuizResult(quiz.id, correct)} />

        <div className="flex justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIndex((current) => (current + 1 >= expressions.length ? 0 : current + 1))}
          >
            下一组表达
          </Button>
        </div>
      </div>
    </Shell>
  );
}
