"use client";

import { PracticeModeNav } from "@/components/practice-mode-nav";
import { Shell } from "@/components/shell";
import { SectionHeading } from "@/components/ui/section-heading";
import { ExamModePanel } from "@/features/review/exam-mode-panel";

export function ChallengeScreen() {
  return (
    <Shell>
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Challenge"
          title="闯关模式"
          description="闯关模式保留独立地图、星级和闯关错题库，并把关卡进行中的本地状态按账户持久化。"
        />

        <PracticeModeNav active="challenge" />
        <ExamModePanel />
      </div>
    </Shell>
  );
}
