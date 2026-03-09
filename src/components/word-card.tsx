"use client";

import { Star } from "lucide-react";
import { AudioButton } from "@/components/audio-button";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { MasteryFeedback, WordEntry } from "@/types/content";

export function WordCard({
  word,
  onFeedback
}: {
  word: WordEntry;
  onFeedback: (feedback: MasteryFeedback) => void;
}) {
  return (
    <Card className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <DifficultyBadge level={word.level} />
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
              {word.partOfSpeech}
            </span>
          </div>
          <div>
            <h3 className="text-4xl font-black text-ink">{word.word}</h3>
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
          />
          <Button variant="secondary" type="button">
            <Star className="mr-2 h-4 w-4" />
            收藏
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Example
          </p>
          <p className="mt-3 text-base leading-7 text-ink">{word.exampleEn}</p>
        </div>
        <div className="rounded-3xl bg-sky/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
            中文辅助
          </p>
          <p className="mt-3 text-base leading-7 text-slate-700">{word.exampleZh}</p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Button type="button" variant="success" onClick={() => onFeedback("known")}>
          我认识
        </Button>
        <Button type="button" variant="secondary" onClick={() => onFeedback("tricky")}>
          有点难
        </Button>
        <Button type="button" variant="ghost" onClick={() => onFeedback("unknown")}>
          不会
        </Button>
      </div>
    </Card>
  );
}
