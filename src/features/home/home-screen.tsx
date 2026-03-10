"use client";

import Link from "next/link";
import contentSummary from "@/data/content-summary.json";
import { ProgressCard } from "@/components/progress-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Shell } from "@/components/shell";
import { StatsPanel } from "@/components/stats-panel";
import { StreakBanner } from "@/components/streak-banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLearningSummary } from "@/hooks/use-learning-summary";
import { useAuthStore } from "@/stores/auth-store";
import type { ContentSummary } from "@/types/content";

const summaryData = contentSummary as ContentSummary;

const entryCards = [
  { href: "/vocabulary", title: "单词学习", description: "巩固高频词、易混词和基础例句。" },
  { href: "/sentences", title: "句子训练", description: "把词汇放进语境，用排序和填空理解句意。" },
  { href: "/reading", title: "短文阅读", description: "用短文训练主旨、细节和词义猜测。" },
  { href: "/expressions", title: "进阶表达", description: "从基础说法过渡到更自然、更正式的表达。" },
  { href: "/review", title: "复习挑战", description: "错题回放、难词优先、随机挑战。" },
  { href: "/stats", title: "学习统计", description: "查看正确率、进度和连续学习天数。" }
];

export function HomeScreen() {
  const summary = useLearningSummary(
    summaryData.totals.words,
    summaryData.totals.sentences,
    summaryData.totals.passages
  );
  const authHydrated = useAuthStore((state) => state.hydrated);
  const currentUsername = useAuthStore((state) => state.currentUsername);

  return (
    <Shell>
      <div className="space-y-8">
        <StreakBanner
          streakDays={Math.max(summary.streakDays, 1)}
          weeklyMinutes={Math.max(summary.weeklyMinutes, 24)}
        />

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="space-y-4">
            <SectionHeading
              eyebrow="Today"
              title={authHydrated && currentUsername ? `欢迎回来，${currentUsername}` : "开始今天的学习"}
              description="账户独立、本地优先、默认不消耗任何运行期大模型密钥。你可以按“单词 → 句子 → 短文 → 表达 → 复习”的节奏推进。"
            />
            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">单词</p>
                <p className="mt-2 text-3xl font-black text-ink">8</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">句子</p>
                <p className="mt-2 text-3xl font-black text-ink">4</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">短文</p>
                <p className="mt-2 text-3xl font-black text-ink">1</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">复习池</p>
                <p className="mt-2 text-3xl font-black text-ink">{summaryData.totals.reviewPool}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/vocabulary">
                <Button>开始今日学习</Button>
              </Link>
              <Link href="/review">
                <Button variant="secondary">进入复习挑战</Button>
              </Link>
            </div>
          </Card>

          <div className="grid gap-4">
            <ProgressCard title="单词掌握" value={summary.wordProgress} detail="按账户独立记录，刷新不串数据。" />
            <ProgressCard title="句子理解" value={summary.sentenceProgress} detail="从词汇识别推进到语境理解。" />
            <ProgressCard title="短文阅读" value={summary.passageProgress} detail="逐步建立上下文推断能力。" />
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeading
            eyebrow="Modules"
            title="核心学习入口"
            description="一屏只做一件事。入口清晰、结构稳定，适合单人长期使用。"
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {entryCards.map((item, index) => (
              <Link key={item.href} href={item.href}>
                <Card className="h-full space-y-4 transition hover:-translate-y-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-surge to-sky text-lg font-black text-white">
                    0{index + 1}
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
            description="首页只读取内容摘要，避免把整套离线数据直接塞进首屏。"
          />
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="space-y-4">
              <h3 className="text-lg font-bold text-ink">本轮单词</h3>
              {summaryData.featuredWords.map((word) => (
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
              {summaryData.featuredSentences.map((sentence) => (
                <div key={sentence.id} className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-sm leading-6 text-ink">{sentence.sentenceEn}</p>
                  <p className="mt-2 text-sm text-slate-500">{sentence.sentenceZh}</p>
                </div>
              ))}
            </Card>

            <Card className="space-y-4">
              <h3 className="text-lg font-bold text-ink">进阶表达</h3>
              {summaryData.featuredExpressions.map((expression) => (
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
              { label: "离线词库", value: `${summaryData.totals.words}`, hint: "当前内置规模" }
            ]}
          />
        </section>
      </div>
    </Shell>
  );
}
