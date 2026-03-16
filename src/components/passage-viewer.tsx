"use client";

import { useEffect, useState } from "react";
import { AudioButton } from "@/components/audio-button";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { HighlightedText } from "@/components/highlighted-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { resolveChineseHighlights } from "@/lib/quiz-support";
import type { PassageEntry } from "@/types/content";

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

  useEffect(() => {
    setActiveParagraph(0);
  }, [passage.id]);

  return (
    <Card className="space-y-6" data-testid="reading-passage-viewer">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <DifficultyBadge level={passage.level} />
            <Badge className="bg-slate-100 text-slate-600">{passage.topic}</Badge>
          </div>
          <div>
            <h3 className="text-3xl font-black text-ink" data-testid="reading-current-title">
              {passage.title}
            </h3>
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
            cloudLabel="云端整篇朗读"
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
                  : "border-transparent bg-slate-50 hover:border-surge/20"
              }`}
            >
              <button type="button" className="w-full text-left" onClick={() => setActiveParagraph(index)}>
                <p className="text-base leading-8 text-ink">
                  <HighlightedText text={paragraph} highlights={passage.keyWords} />
                </p>
                {chineseAssist ? (
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    <HighlightedText
                      text={passage.contentZh[index]}
                      highlights={resolveChineseHighlights(passage.contentZh[index], passage.keyWords)}
                    />
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
                  cloudLabel={`第 ${index + 1} 段云端朗读`}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl bg-white p-5 ring-1 ring-slate-100">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">当前段落</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              点击左侧段落可聚焦理解。当前选中第 {activeParagraph + 1} 段。
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

          <div className="rounded-3xl bg-slate-50 p-5">
            <p className="text-sm leading-6 text-slate-600">
              {isCompleted
                ? "当前账户已完成这篇短文，继续下一篇会更高效。"
                : "完成后会写入当前账户的阅读进度，并计入今日学习统计。"}
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
  );
}
