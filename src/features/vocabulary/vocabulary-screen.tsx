"use client";

import { AudioButton } from "@/components/audio-button";
import { QuizCard } from "@/components/quiz-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shell } from "@/components/shell";
import { getVocabularyQuiz } from "@/data/quizzes";
import { createEmptyQuizSession } from "@/lib/quiz-session";
import { words } from "@/lib/content";
import { useLearningStore } from "@/stores/learning-store";

export function VocabularyScreen() {
  const hydrated = useLearningStore((state) => state.hydrated);
  const activeMode = useLearningStore((state) => state.modeConfig.activeMode);
  const session = useLearningStore((state) => state.vocabularySession);
  const markWord = useLearningStore((state) => state.markWord);
  const logDailyProgress = useLearningStore((state) => state.logDailyProgress);
  const recordQuizResult = useLearningStore((state) => state.recordQuizResult);
  const updateVocabularySession = useLearningStore((state) => state.updateVocabularySession);
  const updateVocabularyQuizSession = useLearningStore((state) => state.updateVocabularyQuizSession);

  if (!hydrated) {
    return (
      <Shell>
        <div className="py-10 text-sm text-slate-500">加载学习进度中...</div>
      </Shell>
    );
  }

  const currentIndex = words.length ? Math.min(session.currentIndex, words.length - 1) : 0;
  const currentWord = words[currentIndex] ?? words[0];
  const quiz = getVocabularyQuiz(currentIndex, activeMode);
  const wordMeta = currentWord as {
    id: string;
    word: string;
    level?: string;
    partOfSpeech?: string;
    pos?: string;
    phonetic?: string;
    pronunciation?: string;
    meaningZh?: string;
  };

  const goNext = () =>
    updateVocabularySession({
      currentIndex: currentIndex + 1 >= words.length ? 0 : currentIndex + 1,
      quiz: createEmptyQuizSession()
    });

  const goPrevious = () =>
    updateVocabularySession({
      currentIndex: currentIndex - 1 < 0 ? words.length - 1 : currentIndex - 1,
      quiz: createEmptyQuizSession()
    });

  return (
    <Shell>
      <div className="space-y-2">
        <Card className="space-y-3 rounded-[1.5rem] p-3.5 md:p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                <span>{activeMode === "simple" ? "简单" : "困难"}</span>
                <span>{wordMeta.level ?? "单词"}</span>
                <span>
                  {currentIndex + 1}/{words.length}
                </span>
                {(wordMeta.partOfSpeech ?? wordMeta.pos) ? (
                  <span>{wordMeta.partOfSpeech ?? wordMeta.pos}</span>
                ) : null}
              </div>

              <div className="space-y-1">
                <h1 className="text-[1.9rem] font-black leading-none text-ink md:text-4xl">{wordMeta.word}</h1>
                {(wordMeta.phonetic ?? wordMeta.pronunciation) ? (
                  <p className="text-sm text-slate-500">{wordMeta.phonetic ?? wordMeta.pronunciation}</p>
                ) : null}
                {wordMeta.meaningZh ? (
                  <p className="text-base font-semibold text-slate-700">{wordMeta.meaningZh}</p>
                ) : null}
              </div>
            </div>

            <div className="flex min-w-[76px] flex-col items-end gap-2">
              {quiz.audioRef ? <AudioButton audioRef={quiz.audioRef} /> : null}
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

          <div className="rounded-2xl bg-slate-50 px-3 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">题干</p>
            <p className="mt-1.5 text-sm font-semibold leading-6 text-ink" data-testid="quiz-prompt">
              {quiz.prompt}
            </p>
            {quiz.promptSupplementZh ? (
              <p className="mt-1.5 text-sm leading-6 text-slate-500">{quiz.promptSupplementZh}</p>
            ) : null}
          </div>
        </Card>

        <QuizCard
          quiz={quiz}
          autoAdvance="correct"
          sessionState={session.quiz}
          onSessionStateChange={updateVocabularyQuizSession}
          onAdvance={goNext}
          onResult={(correct) => {
            recordQuizResult(quiz.id, correct);
            markWord(currentWord.id, correct ? "known" : "unknown");
            logDailyProgress({
              words: 1,
              sentences: 0,
              passages: 0,
              reviews: 0,
              correct: correct ? 1 : 0,
              total: 1
            });
          }}
          compact
          hideHeader
        />
      </div>
    </Shell>
  );
}
