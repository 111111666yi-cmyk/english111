"use client";

import { useState } from "react";
import { sentenceQuizzes } from "@/data/quizzes";
import { QuizCard } from "@/components/quiz-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { SentenceCard } from "@/components/sentence-card";
import { Shell } from "@/components/shell";
import { sentences } from "@/lib/content";
import { useLearningStore } from "@/stores/learning-store";

export function SentencesScreen() {
  const [index, setIndex] = useState(0);
  const completeSentence = useLearningStore((state) => state.completeSentence);
  const logDailyProgress = useLearningStore((state) => state.logDailyProgress);
  const recordQuizResult = useLearningStore((state) => state.recordQuizResult);
  const sentence = sentences[index] ?? sentences[0];
  const quiz = sentenceQuizzes[index % sentenceQuizzes.length] ?? sentenceQuizzes[0];

  return (
    <Shell>
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Sentence"
          title="句子训练"
          description="把高频词放进完整语境里，用朗读、排序、选择和关键词匹配理解句意。"
        />
        <SentenceCard
          sentence={sentence}
          onComplete={() => {
            completeSentence(sentence.id);
            logDailyProgress({
              words: 0,
              sentences: 1,
              passages: 0,
              reviews: 0,
              correct: 1,
              total: 1
            });
            setIndex((current) => (current + 1 >= sentences.length ? 0 : current + 1));
          }}
        />
        <QuizCard quiz={quiz} onResult={(correct) => recordQuizResult(quiz.id, correct)} />
      </div>
    </Shell>
  );
}
