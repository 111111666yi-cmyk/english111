"use client";

import { getCachedCloudAudio, saveCachedCloudAudio } from "@/lib/audio-cache";
import { withBasePath } from "@/lib/base-path";
import { speakText } from "@/lib/speech";
import type { AudioKind } from "@/types/content";

export interface CloudAudioRequest {
  cacheKey: string;
  text: string;
  kind: AudioKind;
}

export interface PlayAudioOptions {
  cacheKey: string;
  localPath?: string;
  text?: string;
  allowSpeechFallback?: boolean;
}

const cloudEnabled = process.env.NEXT_PUBLIC_ENABLE_CLOUD_TTS === "true";
const cloudEndpoint = process.env.NEXT_PUBLIC_CLOUD_TTS_ENDPOINT;
const CLOUD_TTS_TIMEOUT_MS = 5000;

export async function playBlobAudio(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);

  try {
    await audio.play();
    audio.onended = () => URL.revokeObjectURL(url);
    return { ok: true };
  } catch (error) {
    URL.revokeObjectURL(url);
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "音频播放失败。"
    };
  }
}

export async function playLocalAudio(path?: string) {
  if (!path) {
    return { ok: false, reason: "未提供本地音频文件。" };
  }

  const audio = new Audio(withBasePath(path));

  try {
    await audio.play();
    return { ok: true };
  } catch {
    return { ok: false, reason: "本地音频缺失，将尝试浏览器朗读。" };
  }
}

export async function requestCloudTts(payload: CloudAudioRequest) {
  if (!cloudEnabled || !cloudEndpoint) {
    return {
      ok: false,
      reason: "云端发音未启用。"
    };
  }

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return {
      ok: false,
      reason: "当前离线，无法请求云端发音。"
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CLOUD_TTS_TIMEOUT_MS);

  try {
    const response = await fetch(cloudEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!response.ok) {
      console.error("[audio] Cloud TTS request failed.", {
        status: response.status,
        cacheKey: payload.cacheKey
      });
      return {
        ok: false,
        reason: "云端发音请求失败。"
      };
    }

    return {
      ok: true,
      blob: await response.blob()
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.error("[audio] Cloud TTS request timed out.", {
        cacheKey: payload.cacheKey,
        timeoutMs: CLOUD_TTS_TIMEOUT_MS
      });
      return {
        ok: false,
        reason: "云端发音超时，请稍后再试。"
      };
    }

    console.error("[audio] Cloud TTS request threw an error.", {
      cacheKey: payload.cacheKey,
      error
    });
    return {
      ok: false,
      reason: "云端发音失败，已回退到本地播放方式。"
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function playPreferredLocalAudio(options: PlayAudioOptions) {
  if (options.localPath) {
    const localResult = await playLocalAudio(options.localPath);
    if (localResult.ok) {
      return { ok: true, source: "local" as const };
    }
  }

  if (options.text && options.allowSpeechFallback !== false) {
    const speechResult = speakText(options.text);
    return {
      ok: speechResult.ok,
      source: "speech" as const,
      reason: speechResult.reason ?? "已切换为浏览器朗读。"
    };
  }

  return {
    ok: false,
    source: "none" as const,
    reason:
      options.allowSpeechFallback === false
        ? "本地音频缺失，且浏览器朗读回退已关闭。"
        : "没有可播放的本地音频，也没有可朗读文本。"
  };
}

export async function playCloudAudio(options: {
  cacheKey: string;
  text: string;
  kind: AudioKind;
  cacheEnabled: boolean;
}) {
  if (options.cacheEnabled) {
    const cached = await getCachedCloudAudio(options.cacheKey);
    if (cached) {
      const result = await playBlobAudio(cached);
      if (result.ok) {
        return { ok: true, source: "cache" as const };
      }
    }
  }

  const cloudResult = await requestCloudTts({
    cacheKey: options.cacheKey,
    text: options.text,
    kind: options.kind
  });

  if (!cloudResult.ok || !cloudResult.blob) {
    return {
      ok: false,
      source: "cloud" as const,
      reason: cloudResult.reason
    };
  }

  if (options.cacheEnabled) {
    await saveCachedCloudAudio(options.cacheKey, cloudResult.blob);
  }

  const played = await playBlobAudio(cloudResult.blob);

  return played.ok
    ? { ok: true, source: "cloud" as const }
    : { ok: false, source: "cloud" as const, reason: played.reason };
}

export function getCloudTtsAvailability() {
  return {
    enabled: cloudEnabled && Boolean(cloudEndpoint),
    endpointConfigured: Boolean(cloudEndpoint),
    online: typeof navigator === "undefined" ? true : navigator.onLine
  };
}
