"use client";

import { useEffect, type PropsWithChildren } from "react";
import { getActiveProfileKey, useAuthStore } from "@/stores/auth-store";
import { useLearningStore } from "@/stores/learning-store";

export function ClientProviders({ children }: PropsWithChildren) {
  const authHydrated = useAuthStore((state) => state.hydrated);
  const currentUsername = useAuthStore((state) => state.currentUsername);
  const hydrateForProfile = useLearningStore((state) => state.hydrateForProfile);
  const fontScale = useLearningStore((state) => state.settings.fontScale);
  const motionLevel = useLearningStore((state) => state.settings.motionLevel);

  useEffect(() => {
    if (!authHydrated) {
      return;
    }

    hydrateForProfile(getActiveProfileKey(currentUsername));
  }, [authHydrated, currentUsername, hydrateForProfile]);

  useEffect(() => {
    document.documentElement.dataset.fontScale = fontScale;
    document.documentElement.dataset.motionLevel = motionLevel;
  }, [fontScale, motionLevel]);

  return children;
}
