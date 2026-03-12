"use client";

import type { PropsWithChildren } from "react";
import { Navbar } from "@/components/navbar";
import { useLearningStore } from "@/stores/learning-store";

export function Shell({ children }: PropsWithChildren) {
  const storageWarning = useLearningStore((state) => state.storageWarning);
  const clearStorageWarning = useLearningStore((state) => state.clearStorageWarning);

  return (
    <div className="min-h-screen bg-hero-mesh">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">
        {storageWarning ? (
          <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p>{storageWarning}</p>
              <button
                type="button"
                className="font-semibold text-amber-900 underline-offset-2 hover:underline"
                onClick={clearStorageWarning}
              >
                知道了
              </button>
            </div>
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}
