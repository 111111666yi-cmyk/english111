"use client";

import { useState } from "react";
import { Cloud, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCloudTtsAvailability, playCloudAudio, playPreferredLocalAudio } from "@/lib/audio";
import { useLearningStore } from "@/stores/learning-store";
import type { AudioRef } from "@/types/content";

export function AudioButton({
  audioRef,
  localLabel = "本地发音",
  cloudLabel = "云端发音（需网络）",
  className
}: {
  audioRef: AudioRef;
  localLabel?: string;
  cloudLabel?: string;
  className?: string;
}) {
  const [status, setStatus] = useState("");
  const settings = useLearningStore((state) => state.settings);
  const cloudInfo = getCloudTtsAvailability();

  const playLocal = async () => {
    const result = await playPreferredLocalAudio({
      cacheKey: audioRef.cacheKey,
      localPath: audioRef.localPath,
      text: audioRef.text,
      allowSpeechFallback: settings.speechEnabled
    });
    setStatus(
      result.ok
        ? result.source === "local"
          ? "正在播放本地音频。"
          : "已使用浏览器朗读作为兜底。"
        : result.reason ?? "本地发音不可用。"
    );
  };

  const playCloud = async () => {
    if (!audioRef.text) {
      setStatus("当前内容没有可请求的云端文本。");
      return;
    }

    const result = await playCloudAudio({
      cacheKey: audioRef.cacheKey,
      text: audioRef.text,
      kind: audioRef.kind,
      cacheEnabled: settings.cacheCloudAudio
    });

    setStatus(
      result.ok
        ? result.source === "cache"
          ? "已播放缓存的云端音频。"
          : "已播放云端发音。"
        : result.reason ?? "云端发音失败。"
    );
  };

  const showCloudButton = cloudInfo.enabled;
  const cloudDisabled =
    !settings.cloudAudioEnabled || !cloudInfo.online || !cloudInfo.endpointConfigured;

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={playLocal}>
          <Volume2 className="mr-2 h-4 w-4" />
          {localLabel}
        </Button>
        {showCloudButton ? (
          <Button type="button" variant="ghost" disabled={cloudDisabled} onClick={playCloud}>
            <Cloud className="mr-2 h-4 w-4" />
            {cloudLabel}
          </Button>
        ) : null}
      </div>
      {status ? <p className="mt-2 text-xs text-slate-500">{status}</p> : null}
    </div>
  );
}
