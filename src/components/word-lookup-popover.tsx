"use client";

import { Plus, Volume2, X } from "lucide-react";
import { AudioButton } from "@/components/audio-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { WordEntry } from "@/types/content";

export function WordLookupPopover({
  word,
  canAddToReview = true,
  onClose,
  onAddToReview
}: {
  word: WordEntry;
  canAddToReview?: boolean;
  onClose: () => void;
  onAddToReview: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[85] px-4 pb-6 pt-20 md:inset-auto md:absolute md:left-0 md:right-auto md:top-full md:w-[320px] md:px-0 md:pb-0 md:pt-2">
      <Card className="space-y-4 rounded-[1.5rem] border border-white/80 bg-[linear-gradient(145deg,#f8fbff,#dde5ee)] p-4 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-lg font-black text-ink">{word.word}</p>
            <p className="mt-1 text-sm text-subtle-readable">
              {word.phonetic} · {word.partOfSpeech}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/80 text-slate-500"
            aria-label="关闭查词弹层"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-2xl bg-white/78 px-3 py-3">
          <p className="text-sm font-semibold text-ink">{word.meaningZh}</p>
          <p className="mt-2 text-sm leading-6 text-subtle-readable">{word.exampleZh}</p>
        </div>

        <div className="rounded-2xl bg-slate-50/90 px-3 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Example</p>
          <p className="mt-2 text-sm leading-6 text-ink">{word.exampleEn}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <AudioButton
            className="w-full [&_[data-testid='audio-controls']]:w-full"
            audioRef={{
              kind: "word",
              cacheKey: `lookup-${word.id}`,
              localPath: word.audioLocal,
              text: word.pronunciationText ?? word.word
            }}
            localLabel="发音"
            cloudLabel="云端发音"
          />
          <Button type="button" variant="secondary" className="flex-1" onClick={onAddToReview} disabled={!canAddToReview}>
            <Plus className="mr-1 h-4 w-4" />
            {canAddToReview ? "加入复习池" : "仅词库保留"}
          </Button>
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            <Volume2 className="mr-1 h-4 w-4 opacity-0" />
            继续阅读
          </Button>
        </div>
      </Card>
    </div>
  );
}
