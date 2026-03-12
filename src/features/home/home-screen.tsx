"use client";

import Link from "next/link";
import contentSummary from "@/data/content-summary.json";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProgressCard } from "@/components/progress-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Shell } from "@/components/shell";
import { StatsPanel } from "@/components/stats-panel";
import { StreakBanner } from "@/components/streak-banner";
import { useLearningSummary } from "@/hooks/use-learning-summary";
import { useAuthStore } from "@/stores/auth-store";
import type { ContentSummary } from "@/types/content";

const contentPreview = contentSummary as ContentSummary;

const entryCards = [
  { href: "/vocabulary", title: "单词学习", description: "巩固高频词、易混词和基础例句。" },
  { href: "/sentences", title: "句子训练", description: "把词汇放进语境，用排序和填空理解句意。" },
  { href: "/reading", title: "短文阅读", description: "用短文训练主旨、细节和词义猜测。" },
  { href: "/expressions", title: "进阶表达", description: "从基础说法过渡到更自然、更正式的表达。" },
  { href: "/review", title: "复习模式", description: "回放错题池，把做错的题继续追踪下去。" },
  { href: "/test", title: "测试模式", description: "把单词和句子串成连续测验，并保留本地进度。" },
  { href: "/challenge", title: "闯关模式", description: "进入地图闯关，按世界和关卡推进词汇掌握。" },
  { href: "/stats", title: "学习统计", description: "查看正确率、进度和连续学习天数。" }
];

export function HomeScreen() {
  const summary = useLearningSummary(
    contentPreview.totals.words,
    contentPreview.totals.sentences,
    contentPreview.totals.passages
  );
  const authHydrated = useAuthStore((state) => state.hydrated);
  const currentUsername = useAuthStore((state) => state.currentUsername);

  return (
    <Shell>
      <div className="space-y-8">
        <StreakBanner
          streakDays={Math.max(summary.streakDays, 1)}
          weeklyMinutes={summary.weeklyMinutes}
        />

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="space-y-4">
            <SectionHeading
              eyebrow="Today"
              title={authHydrated && currentUsername ? `欢迎回来，${currentUsername}` : "开始今天的学习"}
              description="账户独立、本地优先。你可以按“单词 -> 句子 -> 短文 -> 表达 -> 复习 / 测试 / 闯关”的节奏推进。"
            />
            <div className="grid gap-3 md:grid-cols-4" data-testid="home-today-stats">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">单词</p>
                <p className="mt-2 text-3xl font-black text-ink" data-testid="home-today-words">
                  {summary.todayWords}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">句子</p>
                <p className="mt-2 text-3xl font-black text-ink" data-testid="home-today-sentences">
                  {summary.todaySentences}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">短文</p>
                <p className="mt-2 text-3xl font-black text-ink" data-testid="home-today-passages">
                  {summary.todayPassages}
                </p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">复习池</p>
                <p className="mt-2 text-3xl font-black text-ink">{summary.reviewMistakes}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/vocabulary">
                <Button>开始今日学习</Button>
              </Link>
              <Link href="/review">
                <Button variant="secondary">进入复习模式</Button>
              </Link>
            </div>
          </Card>

          <div className="grid gap-4">
            <ProgressCard title="单词掌握" value={summary.wordProgress} detail="按账户独立记录，刷新不串数据。" />
            <ProgressCard title="句子理解" value={summary.sentenceProgress} detail="从词汇识别推进到语境理解。" />
            <ProgressCard title="短文阅读" value={summary.passageProgress} detail="逐步建立上下文推断能力。" />
          </div>
        </section>

        <Card className="overflow-hidden bg-gradient-to-r from-[#5B78FF] via-[#5AA9F5] to-[#74D4F7] text-white">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div className="space-y-4">
              <div className="inline-flex w-fit rounded-full bg-white/18 px-4 py-2 text-sm font-semibold backdrop-blur">
                Journey
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-black md:text-4xl">进入闯关地图</h2>
                <p className="max-w-2xl text-sm leading-7 text-white/90 md:text-base">
                  从首页或顶栏都可以进入闯关模式。你可以按世界和关卡查看锁定状态、星级和地图进度。
                </p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-3 lg:items-end">
              <Link href="/challenge" data-testid="home-challenge-entry">
                <Button className="bg-white text-ink hover:bg-white/90">打开闯关地图</Button>
              </Link>
              <p className="text-sm text-white/85">可随时从主页或顶栏返回。</p>
            </div>
          </div>
        </Card>

        <section className="space-y-4">
          <SectionHeading
            eyebrow="Modules"
            title="核心学习入口"
            description="复习、测试和闯关都保留为独立页面，桌面端和手机端共用同一套路由结构。"
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {entryCards.map((item, index) => (
              <Link key={item.href} href={item.href}>
                <Card className="h-full space-y-4 transition hover:-translate-y-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-surge to-sky text-lg font-black text-white">
                    {`${index + 1}`.padStart(2, "0")}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-ink">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeading
            eyebrow="Preview"
            title="当前内容预览"
            description="首页只读取内容摘要，避免把整套离线数据直接堆进首屏。"
          />
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="space-y-4">
              <h3 className="text-lg font-bold text-ink">本轮单词</h3>
              {contentPreview.featuredWords.map((word) => (
                <div key={word.id} className="rounded-3xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-ink">{word.word}</p>
                    <span className="text-xs font-semibold text-slate-500">{word.level}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{word.meaningZh}</p>
                </div>
              ))}
            </Card>

            <Card className="space-y-4">
              <h3 className="text-lg font-bold text-ink">本轮句子</h3>
              {contentPreview.featuredSentences.map((sentence) => (
                <div key={sentence.id} className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm leading-6 text-ink">{sentence.sentenceEn}</p>
                  <p className="mt-2 text-sm text-slate-500">{sentence.sentenceZh}</p>
                </div>
              ))}
            </Card>

            <Card className="space-y-4">
              <h3 className="text-lg font-bold text-ink">进阶表达</h3>
              {contentPreview.featuredExpressions.map((expression) => (
                <div key={expression.id} className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">{expression.basic}</p>
                  <p className="mt-2 text-lg font-bold text-ink">{expression.advanced}</p>
                  <p className="mt-2 text-sm text-slate-500">{expression.meaningZh}</p>
                </div>
              ))}
            </Card>
          </div>
        </section>

        <section>
          <StatsPanel
            items={[
              { label: "正确率", value: `${summary.accuracy || 0}%`, hint: "按当前账户统计" },
              { label: "难词数", value: `${summary.difficultWords}`, hint: "优先回放" },
              { label: "离线词库", value: `${contentPreview.totals.words}`, hint: "当前内置规模" }
            ]}
          />
        </section>
      </div>
    </Shell>
  );
}
