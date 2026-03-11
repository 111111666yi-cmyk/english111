"use client";

import { Star } from "lucide-react";
import { AudioButton } from "@/components/audio-button";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { HighlightedText } from "@/components/highlighted-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { resolveChineseHighlights } from "@/lib/quiz-support";
import type { MasteryFeedback, WordEntry } from "@/types/content";

export function WordCard({
  word,
  isFavorite,
  onToggleFavorite,
  onFeedback
}: {
  word: WordEntry;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onFeedback: (feedback: MasteryFeedback) => void;
}) {
  return (
    <Card className="space-y-6" data-testid="word-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <DifficultyBadge level={word.level} />
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
              {word.partOfSpeech}
            </span>
          </div>
          <div>
            <h3 className="text-4xl font-black text-ink" data-testid="word-card-title">
              {word.word}
            </h3>
            <p className="mt-1 text-sm text-slate-500">{word.phonetic}</p>
          </div>
          <p className="text-lg font-semibold text-slate-700">{word.meaningZh}</p>
        </div>

        <div className="space-y-3">
          <AudioButton
            audioRef={{
              kind: "word",
              cacheKey: word.id,
              localPath: word.audioLocal,
              text: word.pronunciationText ?? word.word
            }}
            localLabel="本地发音"
            cloudLabel="云端发音（需网络）"
          />
          <Button variant="secondary" type="button" onClick={onToggleFavorite}>
            <Star className={`mr-2 h-4 w-4 ${isFavorite ? "fill-current text-glow" : ""}`} />
            {isFavorite ? "已收藏" : "收藏"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-slate-50 p-4" data-testid="word-example-en">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Example
          </p>
          <p className="mt-3 text-base leading-7 text-ink">
            <HighlightedText text={word.exampleEn} highlights={[word.word]} />
          </p>
        </div>
        <div className="rounded-3xl bg-sky/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
            中文辅助
          </p>
          <p className="mt-3 text-base leading-7 text-slate-700">
            <HighlightedText
              text={word.exampleZh}
              highlights={resolveChineseHighlights(word.exampleZh, [word.word])}
            />
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Button
          type="button"
          variant="success"
          onClick={() => onFeedback("known")}
          data-testid="word-feedback-known"
        >
          我认识
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => onFeedback("tricky")}
          data-testid="word-feedback-tricky"
        >
          有点难
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => onFeedback("unknown")}
          data-testid="word-feedback-unknown"
        >
          不会
        </Button>
      </div>
    </Card>
  );
}
