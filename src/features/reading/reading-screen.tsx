"use client";

import { useEffect, useMemo, useState } from "react";
import { QuizCard } from "@/components/quiz-card";
import { PassageViewer } from "@/components/passage-viewer";
import { SectionHeading } from "@/components/ui/section-heading";
import { Shell } from "@/components/shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { passages } from "@/lib/content";
import { cn } from "@/lib/utils";
import { useLearningStore } from "@/stores/learning-store";

const PASSAGE_PAGE_SIZE = 24;

export function ReadingScreen() {
  const [index, setIndex] = useState(0);
  const [passagePage, setPassagePage] = useState(0);
  const [feedback, setFeedback] = useState("");
  const chineseAssist = useLearningStore((state) => state.settings.chineseAssist);
  const updateSetting = useLearningStore((state) => state.updateSetting);
  const completePassage = useLearningStore((state) => state.completePassage);
  const completedPassageIds = useLearningStore((state) => state.completedPassageIds);
  const logDailyProgress = useLearningStore((state) => state.logDailyProgress);
  const recordQuizResult = useLearningStore((state) => state.recordQuizResult);

  const passage = passages[index] ?? passages[0];
  const isCompleted = completedPassageIds.includes(passage.id);
  const completionCount = completedPassageIds.length;
  const remainingCount = Math.max(passages.length - completionCount, 0);
  const totalPages = Math.max(1, Math.ceil(passages.length / PASSAGE_PAGE_SIZE));

  useEffect(() => {
    setPassagePage(Math.floor(index / PASSAGE_PAGE_SIZE));
  }, [index]);

  const visiblePassages = useMemo(() => {
    const start = passagePage * PASSAGE_PAGE_SIZE;
    return passages.slice(start, start + PASSAGE_PAGE_SIZE);
  }, [passagePage]);

  return (
    <Shell>
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Reading"
          title="小短文阅读"
          description="阅读页支持多篇切换、明确完成反馈和当前账户独立进度。点击“标记本篇已完成”后会立刻记录，并自动切到下一篇。"
        />

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <p className="text-sm text-slate-500">短文总数</p>
            <p className="mt-2 text-4xl font-black text-ink">{passages.length}</p>
            <p className="mt-2 text-sm text-slate-500">主题覆盖校园、日常、科技、健康等场景。</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">已完成短文</p>
            <p className="mt-2 text-4xl font-black text-ink">{completionCount}</p>
            <p className="mt-2 text-sm text-slate-500">当前账户独立记录，不会串到其他账户。</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">剩余可读</p>
            <p className="mt-2 text-4xl font-black text-ink">{remainingCount}</p>
            <p className="mt-2 text-sm text-slate-500">完成一篇后自动进入下一篇。</p>
          </Card>
        </div>

        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-ink">短文目录</h3>
              <p className="text-sm text-slate-500">目录支持分页，避免大规模内容一次性挤满页面。</p>
            </div>
            <div className="flex items-center gap-3">
              {feedback ? <p className="text-sm font-medium text-surge">{feedback}</p> : null}
              <p className="text-sm text-slate-500">
                第 {passagePage + 1} / {totalPages} 页
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {visiblePassages.map((item) => {
              const itemIndex = passages.findIndex((entry) => entry.id === item.id);
              const completed = completedPassageIds.includes(item.id);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setIndex(itemIndex);
                    setFeedback("");
                  }}
                  className={cn(
                    "rounded-3xl border bg-white px-4 py-4 text-left transition hover:border-surge/40",
                    index === itemIndex && "border-surge bg-sky/10",
                    completed && "border-emerald-200"
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-bold text-ink">{item.title}</p>
                    <span className="text-xs font-semibold text-slate-500">{item.level}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{item.topic}</p>
                  <p className="mt-3 text-xs text-slate-400">{completed ? "已完成" : "未完成"}</p>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={passagePage === 0}
              onClick={() => setPassagePage((current) => Math.max(current - 1, 0))}
            >
              上一页
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={passagePage + 1 >= totalPages}
              onClick={() => setPassagePage((current) => Math.min(current + 1, totalPages - 1))}
            >
              下一页
            </Button>
          </div>
        </Card>

        <PassageViewer
          passage={passage}
          chineseAssist={chineseAssist}
          isCompleted={isCompleted}
          onToggleChinese={() => updateSetting("chineseAssist", !chineseAssist)}
          onComplete={() => {
            if (!isCompleted) {
              completePassage(passage.id);
              logDailyProgress({
                words: 0,
                sentences: 0,
                passages: 1,
                reviews: 0,
                correct: 1,
                total: 1
              });
              setFeedback(`已完成《${passage.title}》，进度已写入当前账户。`);
            } else {
              setFeedback(`《${passage.title}》之前已经完成，已为你切到下一篇。`);
            }

            setIndex((current) => (current + 1 >= passages.length ? 0 : current + 1));
          }}
        />

        <div className="grid gap-4 xl:grid-cols-2">
          {passage.questions.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              onResult={(correct) => recordQuizResult(quiz.id, correct)}
            />
          ))}
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIndex((current) => (current + 1 >= passages.length ? 0 : current + 1))}
          >
            跳到下一篇
          </Button>
        </div>
      </div>
    </Shell>
  );
}
