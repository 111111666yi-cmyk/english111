"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCloudTtsAvailability } from "@/lib/audio";
import { hasSpeechRecognition } from "@/lib/speech";
import { Shell } from "@/components/shell";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLearningStore } from "@/stores/learning-store";

export function SettingsScreen() {
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [online, setOnline] = useState(true);
  const settings = useLearningStore((state) => state.settings);
  const updateSetting = useLearningStore((state) => state.updateSetting);
  const resetAll = useLearningStore((state) => state.resetAll);
  const cloudInfo = getCloudTtsAvailability();

  useEffect(() => {
    setRecognitionSupported(hasSpeechRecognition());
    setOnline(typeof navigator === "undefined" ? true : navigator.onLine);
  }, []);

  return (
    <Shell>
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Settings"
          title="学习设置"
          description="默认启用离线优先能力。设置和学习进度都按当前账户分别保存。"
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-ink">中文辅助</h3>
                <p className="text-sm text-slate-500">阅读页默认显示中文辅助。</p>
              </div>
              <Button
                type="button"
                variant={settings.chineseAssist ? "primary" : "secondary"}
                onClick={() => updateSetting("chineseAssist", !settings.chineseAssist)}
              >
                {settings.chineseAssist ? "已开启" : "已关闭"}
              </Button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-ink">浏览器朗读兜底</h3>
                <p className="text-sm text-slate-500">本地音频缺失时，允许用浏览器语音兜底。</p>
              </div>
              <Button
                type="button"
                variant={settings.speechEnabled ? "primary" : "secondary"}
                onClick={() => updateSetting("speechEnabled", !settings.speechEnabled)}
              >
                {settings.speechEnabled ? "已开启" : "已关闭"}
              </Button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-ink">云端发音按钮</h3>
                <p className="text-sm text-slate-500">
                  {cloudInfo.enabled ? "已检测到云端 TTS 配置。" : "当前未配置云端 TTS。"}
                </p>
              </div>
              <Button
                type="button"
                variant={settings.cloudAudioEnabled ? "primary" : "secondary"}
                disabled={!cloudInfo.enabled}
                onClick={() => updateSetting("cloudAudioEnabled", !settings.cloudAudioEnabled)}
              >
                {settings.cloudAudioEnabled ? "已开启" : "已关闭"}
              </Button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-ink">缓存云端音频</h3>
                <p className="text-sm text-slate-500">开启后将云端音频缓存到 IndexedDB。</p>
              </div>
              <Button
                type="button"
                variant={settings.cacheCloudAudio ? "primary" : "secondary"}
                onClick={() => updateSetting("cacheCloudAudio", !settings.cacheCloudAudio)}
              >
                {settings.cacheCloudAudio ? "已开启" : "已关闭"}
              </Button>
            </div>
          </Card>

          <Card className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-ink">字号大小</h3>
              <div className="flex flex-wrap gap-2">
                {(["sm", "md", "lg"] as const).map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant={settings.fontScale === value ? "primary" : "secondary"}
                    onClick={() => updateSetting("fontScale", value)}
                  >
                    {value.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-ink">动效强度</h3>
              <div className="flex flex-wrap gap-2">
                {(["soft", "calm", "minimal"] as const).map((value) => (
                  <Button
                    key={value}
                    type="button"
                    variant={settings.motionLevel === value ? "primary" : "secondary"}
                    onClick={() => updateSetting("motionLevel", value)}
                  >
                    {value}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-ink">兼容状态</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                浏览器语音识别：{recognitionSupported ? "支持" : "暂不支持"}。网络状态：
                {online ? "在线" : "离线"}。
              </p>
            </div>

            <div className="rounded-3xl bg-slate-50 p-4">
              <h3 className="text-lg font-bold text-ink">账户与数据</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                切换账户后会自动载入该账户自己的学习记录。清空数据只会影响当前账户。
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/account">
                  <Button variant="secondary">前往账户页</Button>
                </Link>
                <Button type="button" variant="ghost" onClick={resetAll}>
                  清空当前账户数据
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
