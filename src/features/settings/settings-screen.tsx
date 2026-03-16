"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { clearCachedCloudAudio, getCloudAudioCacheStats } from "@/lib/audio-cache";
import { getCloudTtsAvailability } from "@/lib/audio";
import { hasSpeechRecognition } from "@/lib/speech";
import { Shell } from "@/components/shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { useLearningStore } from "@/stores/learning-store";

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const fontScaleLabels = {
  sm: "小字",
  md: "中字",
  lg: "大字"
} as const;

const motionLabels = {
  soft: "柔和",
  calm: "顺滑",
  minimal: "极简"
} as const;

const backgroundLabels = {
  default: "默认",
  spring: "春",
  summer: "夏",
  autumn: "秋",
  winter: "冬"
} as const;

const backgroundDescriptions = {
  default: "保持当前默认风格。",
  spring: "粉花轻盈，整体更柔和。",
  summer: "青草清新，整体更有生机。",
  autumn: "枫叶暖红，呼应“枫叶红于二月红”。",
  winter: "雪花清透，整体更安静。"
} as const;

export function SettingsScreen() {
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [online, setOnline] = useState(true);
  const [cacheStats, setCacheStats] = useState({ entries: 0, bytes: 0 });
  const [localStats, setLocalStats] = useState({
    learningBytes: 0,
    authBytes: 0,
    hasLearningRecord: false,
    hasAuthRecord: false
  });
  const [cacheBusy, setCacheBusy] = useState(false);

  const currentUsername = useAuthStore((state) => state.currentUsername);
  const settings = useLearningStore((state) => state.settings);
  const updateSetting = useLearningStore((state) => state.updateSetting);
  const resetAll = useLearningStore((state) => state.resetAll);
  const cloudInfo = getCloudTtsAvailability();

  const refreshCacheStats = useCallback(async () => {
    try {
      const stats = await getCloudAudioCacheStats();
      setCacheStats(stats);
    } catch {
      setCacheStats({ entries: 0, bytes: 0 });
    }
  }, []);

  const refreshLocalStats = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const profileKey = currentUsername ?? "guest";
    const learningRaw = window.localStorage.getItem(`learningData_${profileKey}`) ?? "";
    const authRaw = window.localStorage.getItem("english-climb-auth") ?? "";

    setLocalStats({
      learningBytes: new Blob([learningRaw]).size,
      authBytes: new Blob([authRaw]).size,
      hasLearningRecord: Boolean(learningRaw),
      hasAuthRecord: Boolean(authRaw)
    });
  }, [currentUsername]);

  useEffect(() => {
    setRecognitionSupported(hasSpeechRecognition());
    setOnline(typeof navigator === "undefined" ? true : navigator.onLine);
    void refreshCacheStats();
    refreshLocalStats();
  }, [refreshCacheStats, refreshLocalStats]);

  return (
    <Shell>
      <div className="space-y-3">
        <Card className="space-y-4 rounded-[1.5rem] p-4">
          <div className="theme-settings-module space-y-3 rounded-[1.35rem] px-4 py-4">
            <p className="text-sm font-bold text-ink">音频偏好</p>

            <div className="theme-settings-module flex items-center justify-between gap-4 rounded-2xl px-3 py-3">
              <div className="min-w-0">
                <p className="font-semibold text-ink">本地缺失时启用浏览器朗读</p>
                <p className="text-sm text-slate-500">本地音频缺失时，允许浏览器语音作为兜底。</p>
              </div>
              <Button
                type="button"
                variant={settings.speechEnabled ? "primary" : "secondary"}
                onClick={() => updateSetting("speechEnabled", !settings.speechEnabled)}
              >
                {settings.speechEnabled ? "已开启" : "已关闭"}
              </Button>
            </div>

            <div className="theme-settings-module flex items-center justify-between gap-4 rounded-2xl px-3 py-3">
              <div className="min-w-0">
                <p className="font-semibold text-ink">云端发音按钮</p>
                <p className="text-sm text-slate-500">
                  {cloudInfo.endpointConfigured ? "已检测到云端 TTS 接口。" : "当前未配置云端 TTS 接口。"}
                </p>
              </div>
              <Button
                type="button"
                variant={settings.cloudAudioEnabled ? "primary" : "secondary"}
                onClick={() => updateSetting("cloudAudioEnabled", !settings.cloudAudioEnabled)}
                data-testid="settings-cloud-audio-toggle"
              >
                {settings.cloudAudioEnabled ? "已开启" : "已关闭"}
              </Button>
            </div>

            <div className="theme-settings-module flex items-center justify-between gap-4 rounded-2xl px-3 py-3">
              <div className="min-w-0">
                <p className="font-semibold text-ink">缓存云端音频</p>
                <p className="text-sm text-slate-500">开启后会把云端音频写入本地 IndexedDB。</p>
              </div>
              <Button
                type="button"
                variant={settings.cacheCloudAudio ? "primary" : "secondary"}
                onClick={() => updateSetting("cacheCloudAudio", !settings.cacheCloudAudio)}
              >
                {settings.cacheCloudAudio ? "已开启" : "已关闭"}
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid gap-3 lg:grid-cols-2">
          <Card className="space-y-3 rounded-[1.5rem] p-4">
            <p className="text-sm font-bold text-ink">本地缓存</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="theme-settings-module rounded-2xl px-3 py-3">
                <p className="text-sm text-slate-500">缓存条目</p>
                <p className="mt-1 text-2xl font-black text-ink">{cacheStats.entries}</p>
              </div>
              <div className="theme-settings-module rounded-2xl px-3 py-3">
                <p className="text-sm text-slate-500">缓存体积</p>
                <p className="mt-1 text-2xl font-black text-ink">{formatBytes(cacheStats.bytes)}</p>
              </div>
              <div className="theme-settings-module rounded-2xl px-3 py-3">
                <p className="text-sm text-slate-500">学习记录</p>
                <p className="mt-1 text-lg font-black text-ink">
                  {localStats.hasLearningRecord ? "存在本地学习记录" : "暂无本地学习记录"}
                </p>
                <p className="mt-1 text-xs text-slate-500">{formatBytes(localStats.learningBytes)}</p>
              </div>
              <div className="theme-settings-module rounded-2xl px-3 py-3">
                <p className="text-sm text-slate-500">账号状态</p>
                <p className="mt-1 text-lg font-black text-ink">
                  {localStats.hasAuthRecord ? "存在本地账号信息" : "暂无本地账号信息"}
                </p>
                <p className="mt-1 text-xs text-slate-500">{formatBytes(localStats.authBytes)}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  void refreshCacheStats();
                  refreshLocalStats();
                }}
              >
                刷新
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={cacheBusy}
                onClick={async () => {
                  setCacheBusy(true);
                  await clearCachedCloudAudio().catch(() => undefined);
                  await refreshCacheStats();
                  refreshLocalStats();
                  setCacheBusy(false);
                }}
              >
                {cacheBusy ? "清理中..." : "清空缓存"}
              </Button>
            </div>
            <p className="text-xs leading-5 text-slate-500">
              以上数据真实读取当前设备本地存储，包括 IndexedDB 音频缓存与本地学习记录。
            </p>
          </Card>

          <Card className="space-y-3 rounded-[1.5rem] p-4">
            <p className="text-sm font-bold text-ink">功能入口</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Link href="/version-log">
                <div className="theme-settings-module rounded-2xl px-3 py-3 text-left transition hover:border-surge/40">
                  <p className="text-sm font-bold text-ink">版本日志</p>
                  <p className="mt-1 text-xs text-slate-500">查看更新内容</p>
                </div>
              </Link>
              <Link href="/account">
                <div className="theme-settings-module rounded-2xl px-3 py-3 text-left transition hover:border-surge/40">
                  <p className="text-sm font-bold text-ink">返回我的</p>
                  <p className="mt-1 text-xs text-slate-500">回到账号与资料管理页</p>
                </div>
              </Link>
            </div>

            <div className="theme-settings-module space-y-4 rounded-2xl px-3 py-3">
              <div>
                <p className="text-sm font-bold text-ink">显示与恢复</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["sm", "md", "lg"] as const).map((value) => (
                    <Button
                      key={value}
                      type="button"
                      variant={settings.fontScale === value ? "primary" : "secondary"}
                      onClick={() => updateSetting("fontScale", value)}
                    >
                      {fontScaleLabels[value]}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-ink">动效风格</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["soft", "calm", "minimal"] as const).map((value) => (
                    <Button
                      key={value}
                      type="button"
                      variant={settings.motionLevel === value ? "primary" : "secondary"}
                      onClick={() => updateSetting("motionLevel", value)}
                    >
                      {motionLabels[value]}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-ink">背景</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["default", "spring", "summer", "autumn", "winter"] as const).map((value) => (
                    <Button
                      key={value}
                      type="button"
                      variant={settings.backgroundTheme === value ? "primary" : "secondary"}
                      onClick={() => updateSetting("backgroundTheme", value)}
                    >
                      {backgroundLabels[value]}
                    </Button>
                  ))}
                </div>
                <p className="mt-3 text-sm text-slate-500">{backgroundDescriptions[settings.backgroundTheme]}</p>
              </div>

              <p className="text-sm leading-6 text-slate-500">
                语音识别：{recognitionSupported ? "支持" : "不支持"}。网络状态：{online ? "在线" : "离线"}。
              </p>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="ghost" onClick={resetAll}>
                  重置当前学习进度
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
