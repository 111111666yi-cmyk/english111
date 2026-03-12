"use client";

import { useEffect, useMemo, useState } from "react";
import { getVocabularyQuiz } from "@/data/quizzes";
import { QuizCard } from "@/components/quiz-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Shell } from "@/components/shell";
import { WordCard } from "@/components/word-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { words } from "@/lib/content";
import { cn } from "@/lib/utils";
import { useLearningStore } from "@/stores/learning-store";

const OVERVIEW_PAGE_SIZE = 30;

export function VocabularyScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [overviewPage, setOverviewPage] = useState(0);
  const markWord = useLearningStore((state) => state.markWord);
  const toggleFavoriteWord = useLearningStore((state) => state.toggleFavoriteWord);
  const logDailyProgress = useLearningStore((state) => state.logDailyProgress);
  const recordQuizResult = useLearningStore((state) => state.recordQuizResult);
  const knownWords = useLearningStore((state) => state.knownWords);
  const difficultWords = useLearningStore((state) => state.difficultWords);
  const favoriteWords = useLearningStore((state) => state.favoriteWords);

  const currentWord = words[currentIndex] ?? words[0];
  const quiz = getVocabularyQuiz(currentIndex);
  const totalPages = Math.max(1, Math.ceil(words.length / OVERVIEW_PAGE_SIZE));
  const overviewWords = useMemo(
    () =>
      words.slice(
        overviewPage * OVERVIEW_PAGE_SIZE,
        overviewPage * OVERVIEW_PAGE_SIZE + OVERVIEW_PAGE_SIZE
      ),
    [overviewPage]
  );

  useEffect(() => {
    setOverviewPage(Math.floor(currentIndex / OVERVIEW_PAGE_SIZE));
  }, [currentIndex]);

  const goNext = () => setCurrentIndex((current) => (current + 1 >= words.length ? 0 : current + 1));

  return (
    <Shell>
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Vocabulary"
          title="单词学习"
          description="词卡、例句、音频和掌握反馈都按当前账户分别保存。总览区每页固定显示 30 个互不重复的词。"
        />

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <p className="text-sm text-slate-500">词库总数</p>
            <p className="mt-2 text-4xl font-black text-ink">{words.length}</p>
            <p className="mt-2 text-sm text-slate-500">当前离线词库已扩充到 {words.length} 条词汇。</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">已掌握</p>
            <p className="mt-2 text-4xl font-black text-ink">{knownWords.length}</p>
            <p className="mt-2 text-sm text-slate-500">标记为“我认识”的单词。</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">待复习</p>
            <p className="mt-2 text-4xl font-black text-ink">{difficultWords.length}</p>
            <p className="mt-2 text-sm text-slate-500">标记为“有点难”或“不会”的单词。</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">收藏</p>
            <p className="mt-2 text-4xl font-black text-ink">{favoriteWords.length}</p>
            <p className="mt-2 text-sm text-slate-500">方便回看和重复播放。</p>
          </Card>
        </div>

        <WordCard
          word={currentWord}
          isFavorite={favoriteWords.includes(currentWord.id)}
          onToggleFavorite={() => toggleFavoriteWord(currentWord.id)}
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
            goNext();
          }}
        />

        <QuizCard
          quiz={quiz}
          autoAdvance="correct"
          onAdvance={() => goNext()}
          onResult={(correct) => recordQuizResult(quiz.id, correct)}
        />

        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-ink">词汇总览</h3>
              <p className="text-sm text-slate-500">
                每页 30 个词。点击任意词条可快速跳转到对应词卡。
              </p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-sm text-slate-500">
                当前词：
                <span className="ml-1 font-semibold text-ink">{currentWord.word}</span>
              </p>
              <p className="text-sm text-slate-500">
                第 {overviewPage + 1} / {totalPages} 页
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" data-testid="vocabulary-overview">
            {overviewWords.map((word) => {
              const index = words.findIndex((item) => item.id === word.id);
              const isKnown = knownWords.includes(word.id);
              const isDifficult = difficultWords.includes(word.id);
              const isFavorite = favoriteWords.includes(word.id);

              return (
                <button
                  key={word.id}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  data-testid="vocabulary-overview-item"
                  data-word-id={word.id}
                  className={cn(
                    "rounded-3xl border bg-white px-4 py-4 text-left transition hover:border-surge/40",
                    currentIndex === index && "border-surge bg-sky/10",
                    isKnown && "border-emerald-200",
                    isDifficult && "border-amber-200"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-lg font-bold text-ink" data-testid="overview-word">
                      {word.word}
                    </p>
                    <span className="text-xs font-semibold text-slate-500">{word.level}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{word.meaningZh}</p>
                  <p className="mt-3 text-xs text-slate-400">
                    {isKnown
                      ? "已掌握"
                      : isDifficult
                        ? "待复习"
                        : isFavorite
                          ? "已收藏"
                          : "未标记"}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={overviewPage === 0}
              onClick={() => setOverviewPage((page) => Math.max(page - 1, 0))}
              data-testid="vocabulary-overview-prev"
            >
              上一页
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={overviewPage + 1 >= totalPages}
              onClick={() => setOverviewPage((page) => Math.min(page + 1, totalPages - 1))}
              data-testid="vocabulary-overview-next"
            >
              下一页
            </Button>
          </div>
        </Card>
      </div>
    </Shell>
  );
}
