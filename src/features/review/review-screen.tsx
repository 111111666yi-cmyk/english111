"use client";

import { PracticeModeNav } from "@/components/practice-mode-nav";
import { Shell } from "@/components/shell";
import { SectionHeading } from "@/components/ui/section-heading";
import { ReviewPracticePanel } from "@/features/review/review-practice-panel";

export function ReviewScreen() {
  return (
    <Shell>
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Review"
          title="复习模式"
          description="复习继续负责清错题，保留当前账户的本地进度，不会因为切换页面就丢失。"
        />

        <PracticeModeNav active="review" />
        <ReviewPracticePanel />
      </div>
    </Shell>
  );
}
