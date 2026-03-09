"use client";

import { useMemo, useState } from "react";
import { reviewQueue } from "@/data/quizzes";
import { QuizCard } from "@/components/quiz-card";
import { Shell } from "@/components/shell";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLearningStore } from "@/stores/learning-store";

export function ReviewScreen() {
  const [index, setIndex] = useState(0);
  const reviewMistakes = useLearningStore((state) => state.reviewMistakes);
  const difficultWords = useLearningStore((state) => state.difficultWords.length);
  const recordQuizResult = useLearningStore((state) => state.recordQuizResult);
  const logDailyProgress = useLearningStore((state) => state.logDailyProgress);

  const queue = useMemo(() => {
    const priority = reviewQueue.filter((item) => reviewMistakes.includes(item.id));
    return priority.length ? priority : reviewQueue;
  }, [reviewMistakes]);

  const quiz = queue[index % queue.length];

  return (
    <Shell>
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Review"
          title="复习与挑战"
          description="优先回放错题，再穿插难词与随机挑战。"
        />
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <p className="text-sm text-slate-500">待复习错题</p>
            <p className="mt-2 text-4xl font-black text-ink">{reviewMistakes.length}</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">难词回顾</p>
            <p className="mt-2 text-4xl font-black text-ink">{difficultWords}</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">挑战题池</p>
            <p className="mt-2 text-4xl font-black text-ink">{queue.length}</p>
          </Card>
        </div>
        <QuizCard
          quiz={quiz}
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
        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={() => setIndex((current) => current + 1)}>
            下一题
          </Button>
        </div>
      </div>
    </Shell>
  );
}
