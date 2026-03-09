"use client";

import { useMemo, useState } from "react";
import { vocabularyQuizzes } from "@/data/quizzes";
import { QuizCard } from "@/components/quiz-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Shell } from "@/components/shell";
import { WordCard } from "@/components/word-card";
import { Card } from "@/components/ui/card";
import { words } from "@/lib/content";
import { cn } from "@/lib/utils";
import { useLearningStore } from "@/stores/learning-store";

export function VocabularyScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const markWord = useLearningStore((state) => state.markWord);
  const logDailyProgress = useLearningStore((state) => state.logDailyProgress);
  const recordQuizResult = useLearningStore((state) => state.recordQuizResult);
  const knownWords = useLearningStore((state) => state.knownWords);
  const difficultWords = useLearningStore((state) => state.difficultWords);
  const currentWord = words[currentIndex] ?? words[0];
  const quiz = vocabularyQuizzes[currentIndex % vocabularyQuizzes.length];

  const nextIndex = useMemo(
    () => (currentIndex + 1 >= words.length ? 0 : currentIndex + 1),
    [currentIndex]
  );

  return (
    <Shell>
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Vocabulary"
          title="单词学习"
          description="每张卡片都包含释义、例句、本地发音和掌握反馈，离线也能使用。"
        />
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <p className="text-sm text-slate-500">词汇总览</p>
            <p className="mt-2 text-4xl font-black text-ink">{words.length}</p>
            <p className="mt-2 text-sm text-slate-500">当前示例词库总数</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">已掌握</p>
            <p className="mt-2 text-4xl font-black text-ink">{knownWords.length}</p>
            <p className="mt-2 text-sm text-slate-500">我认识的单词</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">待复习</p>
            <p className="mt-2 text-4xl font-black text-ink">{difficultWords.length}</p>
            <p className="mt-2 text-sm text-slate-500">标记为有点难或不会</p>
          </Card>
        </div>
        <WordCard
          word={currentWord}
          onFeedback={(feedback) => {
            markWord(currentWord.id, feedback);
            logDailyProgress({
              words: 1,
              sentences: 0,
              passages: 0,
              reviews: 0,
              correct: feedback === "known" ? 1 : 0,
              total: 1
            });
            setCurrentIndex(nextIndex);
          }}
        />
        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-ink">词汇总览</h3>
              <p className="text-sm text-slate-500">点击任意词条可快速跳转并开始学习。</p>
            </div>
            <p className="text-sm text-slate-500">
              当前词：<span className="font-semibold text-ink">{currentWord.word}</span>
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {words.map((word, index) => {
              const isKnown = knownWords.includes(word.id);
              const isDifficult = difficultWords.includes(word.id);

              return (
                <button
                  key={word.id}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    "rounded-3xl border bg-white px-4 py-4 text-left transition hover:border-surge/40",
                    currentIndex === index && "border-surge bg-sky/10",
                    isKnown && "border-emerald-200",
                    isDifficult && "border-amber-200"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-lg font-bold text-ink">{word.word}</p>
                    <span className="text-xs font-semibold text-slate-500">{word.level}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{word.meaningZh}</p>
                  <p className="mt-3 text-xs text-slate-400">
                    {isKnown ? "已掌握" : isDifficult ? "待复习" : "未标记"}
                  </p>
                </button>
              );
            })}
          </div>
        </Card>
        <QuizCard quiz={quiz} onResult={(correct) => recordQuizResult(quiz.id, correct)} />
      </div>
    </Shell>
  );
}
