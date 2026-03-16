"use client";

import { useEffect, type PropsWithChildren } from "react";
import { usePathname } from "next/navigation";
import type { PluginListenerHandle } from "@capacitor/core";
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
  const pathname = usePathname() || "/";
  const authHydrated = useAuthStore((state) => state.hydrated);
  const currentUsername = useAuthStore((state) => state.currentUsername);
  const learningHydrated = useLearningStore((state) => state.hydrated);
  const hydrateForProfile = useLearningStore((state) => state.hydrateForProfile);
  const fontScale = useLearningStore((state) => state.settings.fontScale);
  const motionLevel = useLearningStore((state) => state.settings.motionLevel);
  const backgroundTheme = useLearningStore((state) => state.settings.backgroundTheme);
  const updateLastVisitedRoute = useLearningStore((state) => state.updateLastVisitedRoute);
  const updateLastVisitedTab = useLearningStore((state) => state.updateLastVisitedTab);
  const persistNow = useLearningStore((state) => state.persistNow);

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
    document.documentElement.dataset.backgroundTheme = backgroundTheme;
  }, [backgroundTheme, fontScale, motionLevel]);

  useEffect(() => {
    if (!learningHydrated) {
      return;
    }

    updateLastVisitedRoute(pathname);

    if (
      pathname.startsWith("/vocabulary") ||
      pathname.startsWith("/sentences") ||
      pathname.startsWith("/reading") ||
      pathname.startsWith("/expressions")
    ) {
      updateLastVisitedTab("basics", pathname);
    }

    if (pathname.startsWith("/word-library")) {
      updateLastVisitedTab("advanced", pathname);
    }

    if (pathname.startsWith("/test") || pathname.startsWith("/review")) {
      updateLastVisitedTab("practice", pathname);
    }

    persistNow();
  }, [learningHydrated, pathname, persistNow, updateLastVisitedRoute, updateLastVisitedTab]);

  useEffect(() => {
    if (!learningHydrated) {
      return;
    }

    const persist = () => persistNow();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        persistNow();
      }
    };
    const handleFreeze = () => persistNow();

    window.addEventListener("pagehide", persist);
    window.addEventListener("beforeunload", persist);
    window.addEventListener("popstate", persist);
    window.addEventListener("freeze", handleFreeze);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("pause", persist as EventListener);

    let appStateListener: PluginListenerHandle | null = null;
    let pauseListener: PluginListenerHandle | null = null;

    void import("@capacitor/app")
      .then(async ({ App }) => {
        appStateListener = await App.addListener("appStateChange", ({ isActive }) => {
          if (!isActive) {
            persistNow();
          }
        });

        pauseListener = await App.addListener("pause", () => {
          persistNow();
        });
      })
      .catch(() => {
        // Ignore when running outside Capacitor.
      });

    return () => {
      window.removeEventListener("pagehide", persist);
      window.removeEventListener("beforeunload", persist);
      window.removeEventListener("popstate", persist);
      window.removeEventListener("freeze", handleFreeze);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("pause", persist as EventListener);
      void appStateListener?.remove();
      void pauseListener?.remove();
    };
  }, [learningHydrated, persistNow]);

  return children;
}
