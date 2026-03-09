"use client";

import { AudioButton } from "@/components/audio-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { SentenceEntry } from "@/types/content";

export function SentenceCard({
  sentence,
  onComplete
}: {
  sentence: SentenceEntry;
  onComplete: () => void;
}) {
  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <Badge className="bg-peach/50 text-amber-800">句式训练</Badge>
          <h3 className="text-2xl font-bold leading-9 text-ink">{sentence.sentenceEn}</h3>
          <p className="text-base text-slate-600">{sentence.sentenceZh}</p>
        </div>
        <AudioButton
          audioRef={{
            kind: "sentence",
            cacheKey: sentence.id,
            localPath: sentence.audioLocal,
            text: sentence.sentenceEn
          }}
        />
      </div>
      <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Keywords
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {sentence.keywords.map((keyword) => (
              <div key={keyword} className="space-y-2">
                <Badge className="bg-sky/10 text-sky-700">{keyword}</Badge>
                {sentence.keywordAudio?.[keyword] ? (
                  <AudioButton
                    className="text-left"
                    localLabel={`${keyword} 发音`}
                    cloudLabel={`${keyword} 云端发音`}
                    audioRef={{
                      kind: "word",
                      cacheKey: `${sentence.id}-${keyword}`,
                      localPath: sentence.keywordAudio[keyword],
                      text: keyword
                    }}
                  />
                ) : null}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-100">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Grammar
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">{sentence.grammarPoint}</p>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="button" onClick={onComplete}>
          标记已练习
        </Button>
      </div>
    </Card>
  );
}
