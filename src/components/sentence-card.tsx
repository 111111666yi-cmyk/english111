"use client";

import { AudioButton } from "@/components/audio-button";
import { HighlightedText } from "@/components/highlighted-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { resolveChineseHighlights, resolveVisibleHighlights } from "@/lib/quiz-support";
import type { SentenceEntry } from "@/types/content";

export function SentenceCard({
  sentence,
  isCompleted,
  onComplete
}: {
  sentence: SentenceEntry;
  isCompleted: boolean;
  onComplete: () => void;
}) {
  const visibleKeywords = resolveVisibleHighlights(sentence.sentenceEn, sentence.keywords);
  const chineseHighlights = resolveChineseHighlights(sentence.sentenceZh, visibleKeywords);

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <Badge className="bg-peach/50 text-amber-800">句子训练</Badge>
          <h3 className="text-2xl font-bold leading-9 text-ink">
            <HighlightedText text={sentence.sentenceEn} highlights={visibleKeywords} />
          </h3>
          <p className="text-base text-slate-600">
            <HighlightedText text={sentence.sentenceZh} highlights={chineseHighlights} />
          </p>
        </div>
        <AudioButton
          audioRef={{
            kind: "sentence",
            cacheKey: sentence.id,
            localPath: sentence.audioLocal,
            text: sentence.sentenceEn
          }}
          localLabel="本地朗读"
          cloudLabel="云端朗读（需网络）"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Keywords</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {visibleKeywords.map((keyword) => (
              <div key={keyword} className="rounded-2xl bg-white px-3 py-3 ring-1 ring-slate-100">
                <Badge className="bg-sky/10 text-sky-700">{keyword}</Badge>
                {sentence.keywordAudio?.[keyword] ? (
                  <AudioButton
                    className="mt-2 text-left"
                    localLabel={`${keyword} 本地发音`}
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
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Grammar</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">{sentence.grammarPoint}</p>
          <p className="mt-4 text-sm leading-6 text-slate-500">{sentence.explanation}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {isCompleted ? "这句已完成，继续下一句即可。" : "完成后会记录到当前账户的句子进度。"}
        </p>
        <Button type="button" onClick={onComplete} variant={isCompleted ? "secondary" : "primary"}>
          {isCompleted ? "已完成，继续下一句" : "标记已练习"}
        </Button>
      </div>
    </Card>
  );
}
