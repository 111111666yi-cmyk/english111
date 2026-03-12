"use client";

import { useEffect, type PropsWithChildren } from "react";
import { getActiveProfileKey, useAuthStore } from "@/stores/auth-store";
import { useLearningStore } from "@/stores/learning-store";

function finalizeAuthHydration() {
  const state = useAuthStore.getState();
  const keepSession =
    typeof state.sessionExpiresAt === "string" && Date.parse(state.sessionExpiresAt) > Date.now();

  useAuthStore.setState({
    hydrated: true,
    currentUsername: keepSession ? state.currentUsername : undefined,
    sessionExpiresAt: keepSession ? state.sessionExpiresAt : undefined
  });
}

export function ClientProviders({ children }: PropsWithChildren) {
  const authHydrated = useAuthStore((state) => state.hydrated);
  const currentUsername = useAuthStore((state) => state.currentUsername);
  const hydrateForProfile = useLearningStore((state) => state.hydrateForProfile);
  const fontScale = useLearningStore((state) => state.settings.fontScale);
  const motionLevel = useLearningStore((state) => state.settings.motionLevel);

  useEffect(() => {
    const persistApi = useAuthStore.persist;
    const unsubscribe = persistApi.onFinishHydration(() => {
      finalizeAuthHydration();
    });

    if (persistApi.hasHydrated()) {
      finalizeAuthHydration();
    } else {
      void persistApi.rehydrate();
    }

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!authHydrated && currentUsername === undefined) {
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
