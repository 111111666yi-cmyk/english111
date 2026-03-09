"use client";

import { useState } from "react";
import { AudioButton } from "@/components/audio-button";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PassageEntry } from "@/types/content";

export function PassageViewer({
  passage,
  chineseAssist,
  onToggleChinese,
  onComplete
}: {
  passage: PassageEntry;
  chineseAssist: boolean;
  onToggleChinese: () => void;
  onComplete: () => void;
}) {
  const [activeParagraph, setActiveParagraph] = useState(0);

  return (
    <Card className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <DifficultyBadge level={passage.level} />
            <Badge className="bg-slate-100 text-slate-600">{passage.topic}</Badge>
          </div>
          <div>
            <h3 className="text-3xl font-black text-ink">{passage.title}</h3>
            <p className="mt-2 text-sm text-slate-500">
              预计 {passage.estimatedMinutes} 分钟，适合从词汇过渡到阅读理解。
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
            localLabel="本地整篇朗读"
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
              key={paragraph}
              className="rounded-3xl border border-transparent bg-slate-50 p-5 transition hover:border-surge/30"
            >
              <button
                type="button"
                className="w-full text-left"
                onClick={() => setActiveParagraph(index)}
              >
                <p className="text-base leading-8 text-ink">{paragraph}</p>
                {chineseAssist ? (
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    {passage.contentZh[index]}
                  </p>
                ) : null}
              </button>
              <div className="mt-4">
                <AudioButton
                  audioRef={{
                    kind: "passage",
                    cacheKey: `${passage.id}-paragraph-${index + 1}`,
                    localPath: passage.paragraphAudio?.[index],
                    text: paragraph
                  }}
                  localLabel={`第 ${index + 1} 段本地朗读`}
                  cloudLabel={`第 ${index + 1} 段云端发音`}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-100">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              当前段落
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              点击左侧段落可以聚焦理解。当前选中第 {activeParagraph + 1} 段。
            </p>
          </div>
          <div className="rounded-3xl bg-sky/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              Key Words
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {passage.keyWords.map((keyword) => (
                <Badge key={keyword} className="bg-white text-surge">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
          <Button type="button" className="w-full" onClick={onComplete}>
            标记本篇已完成
          </Button>
        </div>
      </div>
    </Card>
  );
}
