"use client";

import type { PropsWithChildren } from "react";
import { Navbar } from "@/components/navbar";
import { useLearningStore } from "@/stores/learning-store";

export function Shell({ children }: PropsWithChildren) {
  const storageWarning = useLearningStore((state) => state.storageWarning);
  const clearStorageWarning = useLearningStore((state) => state.clearStorageWarning);

  return (
    <div className="app-frame bg-hero-mesh">
      <Navbar />
      <main className="app-main mx-auto max-w-6xl px-4 py-5 md:px-6 md:py-8">
        {storageWarning ? (
          <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p>{storageWarning}</p>
              <button
                type="button"
                className="font-semibold text-amber-900 underline-offset-2 hover:underline"
                onClick={clearStorageWarning}
              >
                {"\u77e5\u9053\u4e86"}
              </button>
            </div>
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}
