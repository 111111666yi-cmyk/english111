"use client";

import { Shell } from "@/components/shell";
import { TestModePanel } from "@/features/review/test-mode-panel";

export function TestScreen() {
  return (
    <Shell>
      <TestModePanel />
    </Shell>
  );
}
