"use client";

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
          description="测试页把单词和句子串成连续测验，题号、错题和回看位置都会按当前账户保存在本地。"
        />

        <TestModePanel />
      </div>
    </Shell>
  );
}
