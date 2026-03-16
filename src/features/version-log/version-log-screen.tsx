"use client";

import { Shell } from "@/components/shell";
import { Card } from "@/components/ui/card";

const changelogs = [
  {
    version: "v1.4",
    title: "视觉升级",
    items: [
      "应用图标改为提取后的正式 A 主体图标，并统一桌面、开屏与应用内品牌入口。",
      "开屏与登录首屏围绕新图标做轻量过渡动画，整体品牌名统一为 Open English。",
      "优化闯关地图顶部留白，并将关卡装饰点替换为更轻量的星星元素。"
    ]
  },
  {
    version: "v1.3",
    title: "品牌升级",
    items: [
      "应用品牌统一更名为 Open English。",
      "重做手机端开屏动画与登录首屏的进入观感。",
      "更新 Android 图标与原生 splash 资源。",
      "完成 v1.3 调试包安装与主链路验收。"
    ]
  },
  {
    version: "v1.2",
    title: "发布前整理",
    items: [
      "设置页接入版本日志入口与真实本地缓存信息。",
      "统一全局微动效与按压反馈。",
      "修复闯关弹层与地图交互细节。",
      "准备 Android 真机资源与功能验收。"
    ]
  },
  {
    version: "v1.1",
    title: "学习流重构",
    items: [
      "基础四模块统一自动跳题与位置恢复。",
      "词库支持独立分页浏览与本地持久化。",
      "闯关改为地图选关与独立答题流。",
      "我的、设置、统计、成就页面拆分完成。"
    ]
  },
  {
    version: "v1.0",
    title: "初始可用版",
    items: [
      "完成基础学习、测试、闯关主能力。",
      "接入本地账号与本地学习记录。",
      "支持 Android 打包与离线语音播放。",
      "完成首轮真机可用性验证。"
    ]
  }
] as const;

export function VersionLogScreen() {
  return (
    <Shell>
      <div className="space-y-3">
        {changelogs.map((log) => (
          <Card key={log.version} className="space-y-3 rounded-[1.5rem] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">版本</p>
                <h2 className="mt-1 text-xl font-black text-ink">{log.version}</h2>
              </div>
              <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                {log.title}
              </span>
            </div>
            <div className="space-y-2">
              {log.items.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/70 bg-white/70 px-3 py-2.5 text-sm leading-6 text-slate-600"
                >
                  {item}
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </Shell>
  );
}
