"use client";

import { useState } from "react";
import { Shell } from "@/components/shell";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";
import { ExamModePanel } from "@/features/review/exam-mode-panel";
import { ReviewPracticePanel } from "@/features/review/review-practice-panel";
import { TestModePanel } from "@/features/review/test-mode-panel";

const modes = [
  {
    id: "review",
    label: "复习模式",
    description: "回放当前错题池，并继续把做错的题追踪下去。"
  },
  {
    id: "test",
    label: "测试模式",
    description: "把单词和句子串成连续测验，错题直接送入复习。"
  },
  {
    id: "exam",
    label: "考试模式",
    description: "进入地图闯关，只用词汇世界做关卡推进和星级结算。"
  }
] as const;

type ReviewMode = (typeof modes)[number]["id"];

export function ReviewScreen() {
  const [mode, setMode] = useState<ReviewMode>("review");

  return (
    <Shell>
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Review"
          title="复习、测试与考试"
          description="复习继续负责清错题，测试负责把单词和句子串起来，考试则单独走地图闯关与星级记录。"
        />

        <div className="rounded-[2rem] bg-white/80 p-3 ring-1 ring-slate-200/80">
          <div className="grid gap-2 md:grid-cols-3" data-testid="review-mode-switch">
            {modes.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id)}
                className={cn(
                  "rounded-[1.5rem] px-4 py-4 text-left transition",
                  mode === item.id ? "bg-gradient-to-r from-surge to-sky text-white shadow-glass" : "bg-slate-50 text-slate-600"
                )}
              >
                <p className="text-sm font-semibold">{item.label}</p>
                <p className={cn("mt-2 text-sm leading-6", mode === item.id ? "text-white/90" : "text-slate-500")}>
                  {item.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {mode === "review" ? <ReviewPracticePanel /> : null}
        {mode === "test" ? <TestModePanel /> : null}
        {mode === "exam" ? <ExamModePanel /> : null}
      </div>
    </Shell>
  );
}
