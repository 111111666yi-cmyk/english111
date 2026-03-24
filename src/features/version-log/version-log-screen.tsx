"use client";

import { appConfig } from "@/lib/app-config";
import { Shell } from "@/components/shell";
import { Card } from "@/components/ui/card";

const changelogs = [
  {
    version: "v1.7",
    title: "版本定格与整轮清扫",
    items: [
      "统一正式服与登录首屏的版本标识，当前稳定版本正式定格为 v1.7。",
      "对代码、资源、音频映射和闯关/成就逻辑做了一轮集中清扫，并补齐回归验证链路。",
      "新增发布级词库白名单，把正式学习流与词库保留内容彻底分层，并同步更新掌握统计、测试、复习和闯关分母。",
      "补上内容发布审计与音频孤儿检查，新增词库调整/清洗说明，发布前可直接产出白名单与审计报告。",
      "修复短文本地朗读桥接稳定性，补强 Android 原生语音初始化与回退逻辑。",
      "重新整理“我的”、学习统计和成就中心的结构表现，并更新成就宝箱奖励机制。"
    ]
  },
  {
    version: "v1.6",
    title: "主题、短文与声音升级",
    items: [
      "修复暗色新拟态下单词、短文、表达等学习页标题与正文发黑的问题，暗色背景下可读性明显提升。",
      "重建短文内容与目录结构，扩充 32 篇中文目录短文，统一补齐整篇与分段朗读映射。",
      "优化设置页与商城的卡片交互逻辑，强化当前生效项展示、试用分离和免费/高级边界说明。",
      "新增环境音乐控制总览，保留右侧全局停播入口，并同步完善资源完整性校验与自测链路。"
    ]
  },
  {
    version: "v1.5",
    title: "内测体验升级",
    items: [
      "补齐顶部安全区、轻量动效、危险操作确认层和设置页结构瘦身。",
      "新增四季免费主题、基础与高级音效、星芒经济系统和商城预览兑换闭环。",
      "学习页整合例句与补充区，支持独立例句、翻译、高亮和本地发音链路。"
    ]
  },
  {
    version: "v1.4",
    title: "视觉升级",
    items: [
      "应用图标升级为正式品牌图标，并统一桌面、开屏与应用内品牌入口。",
      "优化开屏与登录首屏的进入动效，品牌名称统一为 Open English。",
      "调整闯关地图顶部留白与装饰层次，首屏信息更清晰。"
    ]
  },
  {
    version: "v1.3",
    title: "品牌升级",
    items: [
      "应用品牌统一更名为 Open English。",
      "重做手机端开屏动画与登录首屏的进入体验。",
      "更新 Android 图标与原生 splash 资源，完成真机安装验证。"
    ]
  },
  {
    version: "v1.2",
    title: "发布前整理",
    items: [
      "设置页接入版本日志入口与本地缓存信息展示。",
      "统一全局微动效与按压反馈，补齐细节过渡。",
      "修复闯关弹层、地图交互与真机打包链路。"
    ]
  },
  {
    version: "v1.1",
    title: "学习流重构",
    items: [
      "基础四模块统一自动跳题与位置恢复逻辑。",
      "词库支持独立分页浏览与本地持久化。",
      "闯关升级为地图选关与独立答题流。"
    ]
  },
  {
    version: "v1.0",
    title: "首个可用版本",
    items: [
      "完成基础学习、测试、闯关三条主链路。",
      "接入本地账号与本地学习记录。",
      "支持 Android 打包与离线音频播放。"
    ]
  }
] as const;

export function VersionLogScreen() {
  return (
    <Shell>
      <div className="space-y-4">
        <Card className="rounded-[1.75rem] bg-[linear-gradient(135deg,rgba(191,219,254,0.26),rgba(255,255,255,0.96),rgba(254,240,138,0.22))] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-surge">Release Notes</p>
          <h1 className="mt-2 text-3xl font-black text-ink">版本日志</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            当前应用版本：{appConfig.shortVersion}。这里会持续记录正式更新过的内容和关键修复点。
          </p>
        </Card>

        {changelogs.map((log) => (
          <Card key={log.version} className="space-y-3 rounded-[1.5rem] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] theme-secondary-text">版本</p>
                <h2 className="mt-1 text-xl font-black theme-primary-text">{log.version}</h2>
              </div>
              <span className="theme-inline-panel rounded-full px-3 py-1 text-xs font-semibold theme-secondary-text">
                {log.title}
              </span>
            </div>
            <div className="space-y-2">
              {log.items.map((item) => (
                <div
                  key={item}
                  className="theme-inline-panel rounded-2xl px-3 py-2.5 text-sm leading-6 theme-secondary-text"
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
