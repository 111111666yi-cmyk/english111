"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AudioButton } from "@/components/audio-button";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { HighlightedText } from "@/components/highlighted-text";
import { WordLookupPopover } from "@/components/word-lookup-popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isReleaseWordId, words } from "@/lib/content";
import { resolveChineseHighlights } from "@/lib/quiz-support";
import { useLearningStore } from "@/stores/learning-store";
import type { PassageEntry, WordEntry } from "@/types/content";

const wordLookup = new Map(words.map((word) => [word.word.toLowerCase(), word]));
const reviewQuizLookup = new Map(words.map((word) => [word.id, `quiz-word-${word.id}-meaning`]));

function normalizeLookupToken(token: string) {
  return token.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, "").toLowerCase();
}

function findWordEntry(token: string) {
  const normalized = normalizeLookupToken(token);
  if (!normalized) {
    return null;
  }

  return wordLookup.get(normalized) ?? null;
}

function InteractiveParagraph({
  text,
  keywords,
  onLookup
}: {
  text: string;
  keywords: string[];
  onLookup: (word: WordEntry) => void;
}) {
  const pressTimerRef = useRef<number | null>(null);
  const parts = useMemo(() => text.split(/(\s+)/), [text]);

  return (
    <p className="text-base leading-8 theme-surface-heading">
      {parts.map((part, index) => {
        if (/^\s+$/.test(part)) {
          return <span key={`${part}-${index}`}>{part}</span>;
        }

        const match = findWordEntry(part);
        const keywordMatched = keywords.some((keyword) => keyword.toLowerCase() === normalizeLookupToken(part));

        if (!match) {
          return keywordMatched ? (
            <mark
              key={`${part}-${index}`}
              className="rounded-lg bg-glow/70 px-1.5 py-0.5 font-semibold text-ink shadow-[inset_0_-1px_0_rgba(255,255,255,0.45)]"
            >
              {part}
            </mark>
          ) : (
            <span key={`${part}-${index}`}>{part}</span>
          );
        }

        const openLookup = () => onLookup(match);

        return (
          <button
            key={`${part}-${index}`}
            type="button"
            className={`rounded-lg px-1 py-0.5 text-left transition ${
              keywordMatched ? "bg-glow/70 font-semibold shadow-[inset_0_-1px_0_rgba(255,255,255,0.45)]" : "hover:bg-sky/10"
            }`}
            onClick={openLookup}
            onPointerDown={() => {
              pressTimerRef.current = window.setTimeout(openLookup, 360);
            }}
            onPointerUp={() => {
              if (pressTimerRef.current !== null) {
                window.clearTimeout(pressTimerRef.current);
                pressTimerRef.current = null;
              }
            }}
            onPointerLeave={() => {
              if (pressTimerRef.current !== null) {
                window.clearTimeout(pressTimerRef.current);
                pressTimerRef.current = null;
              }
            }}
          >
            {part}
          </button>
        );
      })}
    </p>
  );
}

export function PassageViewer({
  passage,
  chineseAssist,
  isCompleted,
  onToggleChinese,
  onComplete
}: {
  passage: PassageEntry;
  chineseAssist: boolean;
  isCompleted: boolean;
  onToggleChinese: () => void;
  onComplete: () => void;
}) {
  const [activeParagraph, setActiveParagraph] = useState(0);
  const [lookupWord, setLookupWord] = useState<WordEntry | null>(null);
  const addReviewQuiz = useLearningStore((state) => state.addReviewQuiz);

  useEffect(() => {
    setActiveParagraph(0);
    setLookupWord(null);
  }, [passage.id]);

  return (
    <div className="relative">
      <Card className="space-y-5 rounded-[1.5rem] p-4" data-testid="reading-passage-viewer">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <DifficultyBadge level={passage.level} />
              <Badge className="bg-slate-100 text-slate-600">{passage.topic}</Badge>
              <Badge className="bg-white theme-secondary-text">
                阅读位置 {activeParagraph + 1}/{passage.contentEn.length}
              </Badge>
            </div>
            <div>
              <h3 className="text-[1.7rem] font-black theme-surface-heading md:text-[2rem]" data-testid="reading-current-title">
                {passage.title}
              </h3>
              <p className="mt-2 text-sm theme-surface-copy">
                预计 {passage.estimatedMinutes} 分钟；支持点击或长按英文单词直接查词，不打断阅读。
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <AudioButton
              audioRef={{
                kind: "passage",
                cacheKey: passage.id,
                localPath: passage.audioLocal,
                text: passage.contentEn.join(" ")
              }}
              localLabel="整篇朗读"
              showCloud={false}
            />
            <Button type="button" variant="secondary" onClick={onToggleChinese}>
              {chineseAssist ? "隐藏中文辅助" : "显示中文辅助"}
            </Button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.6fr_0.8fr]">
          <div className="space-y-4">
            {passage.contentEn.map((paragraph, index) => (
              <div
                key={`${passage.id}-${index + 1}`}
                className={`rounded-3xl border p-5 transition ${
                  activeParagraph === index
                    ? "border-surge/40 bg-sky/10"
                    : "border-transparent theme-inline-panel hover:border-surge/20"
                }`}
              >
                <button type="button" className="block w-full text-left" onClick={() => setActiveParagraph(index)}>
                  <InteractiveParagraph
                    text={paragraph}
                    keywords={passage.keyWords}
                    onLookup={(word) => {
                      setActiveParagraph(index);
                      setLookupWord(word);
                    }}
                  />
                </button>
                {chineseAssist ? (
                  <p className="mt-3 text-sm leading-7 theme-surface-copy">
                    <HighlightedText
                      text={passage.contentZh[index]}
                      highlights={resolveChineseHighlights(passage.contentZh[index], passage.keyWords)}
                    />
                  </p>
                ) : null}
                <div className="mt-4">
                  <AudioButton
                    audioRef={{
                      kind: "passage",
                      cacheKey: `${passage.id}-paragraph-${index + 1}`,
                      localPath: passage.paragraphAudio?.[index],
                      text: paragraph
                    }}
                    localLabel={`第 ${index + 1} 段朗读`}
                    showCloud={false}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="theme-inline-panel rounded-3xl p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] theme-secondary-text">当前段落</p>
              <p className="mt-3 text-sm leading-7 theme-primary-text">
                当前聚焦第 {activeParagraph + 1} 段。点击或长按生词可直接查看释义、发音和例句。
              </p>
            </div>

            <div className="rounded-3xl bg-sky/10 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Key Words</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {passage.keyWords.map((keyword) => (
                  <Badge key={keyword} className="bg-white text-surge">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="theme-inline-panel rounded-3xl p-5">
              <p className="text-sm leading-6 theme-primary-text">
                {isCompleted
                  ? "这篇短文已经完成，可以继续下一篇；查词不会打断当前阅读进度。"
                  : "完成后会写入当前账号的阅读进度，查词气泡关闭后可继续原位置阅读。"}
              </p>
            </div>

            <Button
              type="button"
              className="w-full"
              variant={isCompleted ? "secondary" : "primary"}
              onClick={onComplete}
              data-testid="reading-complete-button"
            >
              {isCompleted ? "已完成，继续下一篇" : "标记本篇已完成"}
            </Button>
          </div>
        </div>
      </Card>

      {lookupWord ? (
        <WordLookupPopover
          word={lookupWord}
          canAddToReview={isReleaseWordId(lookupWord.id)}
          onClose={() => setLookupWord(null)}
          onAddToReview={() => {
            const reviewQuizId = reviewQuizLookup.get(lookupWord.id);
            if (reviewQuizId) {
              addReviewQuiz(reviewQuizId);
            }
            setLookupWord(null);
          }}
        />
      ) : null}
    </div>
  );
}
