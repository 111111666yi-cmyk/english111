"use client";

import { QuizCard } from "@/components/quiz-card";
import { SentenceCard } from "@/components/sentence-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shell } from "@/components/shell";
import { getSentenceQuiz } from "@/data/quizzes";
import { createEmptyQuizSession } from "@/lib/quiz-session";
import { sentences } from "@/lib/content";
import { useLearningStore } from "@/stores/learning-store";

export function SentencesScreen() {
  const hydrated = useLearningStore((state) => state.hydrated);
  const session = useLearningStore((state) => state.sentencesSession);
  const completeSentence = useLearningStore((state) => state.completeSentence);
  const completedSentenceIds = useLearningStore((state) => state.completedSentenceIds);
  const logDailyProgress = useLearningStore((state) => state.logDailyProgress);
  const recordQuizResult = useLearningStore((state) => state.recordQuizResult);
  const updateSentencesSession = useLearningStore((state) => state.updateSentencesSession);
  const updateSentencesQuizSession = useLearningStore((state) => state.updateSentencesQuizSession);

  if (!hydrated) {
    return (
      <Shell>
        <div className="py-10 text-sm text-slate-500">加载学习进度中...</div>
      </Shell>
    );
  }

  const currentIndex = sentences.length ? Math.min(session.currentIndex, sentences.length - 1) : 0;
  const sentence = sentences[currentIndex] ?? sentences[0];
  const quiz = getSentenceQuiz(currentIndex);
  const isCompleted = completedSentenceIds.includes(sentence.id);

  const goNext = () =>
    updateSentencesSession({
      currentIndex: currentIndex + 1 >= sentences.length ? 0 : currentIndex + 1,
      quiz: createEmptyQuizSession()
    });

  const goPrevious = () =>
    updateSentencesSession({
      currentIndex: currentIndex - 1 < 0 ? sentences.length - 1 : currentIndex - 1,
      quiz: createEmptyQuizSession()
    });

  return (
    <Shell>
      <div className="space-y-4">
        <Card className="rounded-[1.5rem] p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-500">
              {currentIndex + 1}/{sentences.length}
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" className="h-9 min-w-9 px-3" onClick={goPrevious}>
                {"<"}
              </Button>
              <Button type="button" variant="secondary" className="h-9 min-w-9 px-3" onClick={goNext}>
                {">"}
              </Button>
            </div>
          </div>
        </Card>

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

            goNext();
          }}
        />

        <QuizCard
          quiz={quiz}
          autoAdvance="correct"
          sessionState={session.quiz}
          onSessionStateChange={updateSentencesQuizSession}
          onAdvance={() => goNext()}
          onResult={(correct) => recordQuizResult(quiz.id, correct)}
        />
      </div>
    </Shell>
  );
}
