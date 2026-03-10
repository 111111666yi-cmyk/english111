"use client";

import { useState } from "react";
import { sentenceQuizzes } from "@/data/quizzes";
import { QuizCard } from "@/components/quiz-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { SentenceCard } from "@/components/sentence-card";
import { Shell } from "@/components/shell";
import { Card } from "@/components/ui/card";
import { sentences } from "@/lib/content";
import { useLearningStore } from "@/stores/learning-store";

export function SentencesScreen() {
  const [index, setIndex] = useState(0);
  const completeSentence = useLearningStore((state) => state.completeSentence);
  const completedSentenceIds = useLearningStore((state) => state.completedSentenceIds);
  const logDailyProgress = useLearningStore((state) => state.logDailyProgress);
  const recordQuizResult = useLearningStore((state) => state.recordQuizResult);
  const sentence = sentences[index] ?? sentences[0];
  const quiz = sentenceQuizzes[index % sentenceQuizzes.length] ?? sentenceQuizzes[0];
  const isCompleted = completedSentenceIds.includes(sentence.id);

  return (
    <Shell>
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Sentence"
          title="句子训练"
          description="句子数量已扩充，阅读关键词会直接高亮。完成一条句子后会明确写入当前账户进度，并自动切换下一条。"
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <p className="text-sm text-slate-500">句子总数</p>
            <p className="mt-2 text-4xl font-black text-ink">{sentences.length}</p>
            <p className="mt-2 text-sm text-slate-500">从基础词汇到语境训练逐步扩展。</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">已完成句子</p>
            <p className="mt-2 text-4xl font-black text-ink">{completedSentenceIds.length}</p>
            <p className="mt-2 text-sm text-slate-500">当前账户下独立统计。</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">当前序号</p>
            <p className="mt-2 text-4xl font-black text-ink">{index + 1}</p>
            <p className="mt-2 text-sm text-slate-500">切换内容不会影响其他账户。</p>
          </Card>
        </div>

        <SentenceCard
          sentence={sentence}
          isCompleted={isCompleted}
          onComplete={() => {
            if (!isCompleted) {
              completeSentence(sentence.id);
              logDailyProgress({
                words: 0,
                sentences: 1,
                passages: 0,
                reviews: 0,
                correct: 1,
                total: 1
              });
            }

            setIndex((current) => (current + 1 >= sentences.length ? 0 : current + 1));
          }}
        />

        <QuizCard quiz={quiz} onResult={(correct) => recordQuizResult(quiz.id, correct)} />
      </div>
    </Shell>
  );
}
