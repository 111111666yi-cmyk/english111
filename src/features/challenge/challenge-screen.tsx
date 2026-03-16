"use client";

import { useSearchParams } from "next/navigation";
import { ExamModePanel } from "@/features/challenge/exam-mode-panel";
import { Shell } from "@/components/shell";

export function ChallengeScreen() {
  const searchParams = useSearchParams();
  const completedLevelId = searchParams.get("completed");
  const unlockedLevelId = searchParams.get("unlocked");

  return (
    <Shell>
      <ExamModePanel completedLevelId={completedLevelId} unlockedLevelId={unlockedLevelId} />
    </Shell>
  );
}
