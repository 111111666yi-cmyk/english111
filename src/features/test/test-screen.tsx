"use client";

import { PracticeModeNav } from "@/components/practice-mode-nav";
import { Shell } from "@/components/shell";
import { SectionHeading } from "@/components/ui/section-heading";
import { TestModePanel } from "@/features/review/test-mode-panel";

export function TestScreen() {
  return (
    <Shell>
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Test"
          title="测试模式"
          description="测试会把单词和句子串起来连续推进，当前题号和错题池都会按账户保存在本地。"
        />

        <PracticeModeNav active="test" />
        <TestModePanel />
      </div>
    </Shell>
  );
}
