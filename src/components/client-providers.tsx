"use client";

import { useEffect, type PropsWithChildren } from "react";
import { useLearningStore } from "@/stores/learning-store";

export function ClientProviders({ children }: PropsWithChildren) {
  const fontScale = useLearningStore((state) => state.settings.fontScale);
  const motionLevel = useLearningStore((state) => state.settings.motionLevel);

  useEffect(() => {
    document.documentElement.dataset.fontScale = fontScale;
    document.documentElement.dataset.motionLevel = motionLevel;
  }, [fontScale, motionLevel]);

  return children;
}
