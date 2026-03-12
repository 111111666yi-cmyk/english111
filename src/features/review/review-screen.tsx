"use client";

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
          description="复习页只负责回放当前错题池，并继续把做错的题追踪下去。切换页面后会按账户保留本地进度。"
        />

        <ReviewPracticePanel />
      </div>
    </Shell>
  );
}
