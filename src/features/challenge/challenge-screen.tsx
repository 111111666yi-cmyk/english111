"use client";

import { useSearchParams } from "next/navigation";
import { DesktopChallengeMap } from "@/features/challenge/desktop-challenge-map";
import { ExamModePanel } from "@/features/challenge/exam-mode-panel";
import { Shell } from "@/components/shell";

export function ChallengeScreen() {
  const searchParams = useSearchParams();
  const completedLevelId = searchParams.get("completed");
  const unlockedLevelId = searchParams.get("unlocked");

  return (
    <Shell>
      <>
        <DesktopChallengeMap completedLevelId={completedLevelId} unlockedLevelId={unlockedLevelId} />
        <div className="md:hidden">
          <ExamModePanel completedLevelId={completedLevelId} unlockedLevelId={unlockedLevelId} />
        </div>
      </>
    </Shell>
  );
}
