"use client";

import type { PropsWithChildren } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/navbar";
import { useLearningStore } from "@/stores/learning-store";

export function Shell({ children }: PropsWithChildren) {
  const pathname = usePathname() || "/";
  const storageWarning = useLearningStore((state) => state.storageWarning);
  const clearStorageWarning = useLearningStore((state) => state.clearStorageWarning);
  const isBasicsRoute = ["/vocabulary", "/sentences", "/reading", "/expressions"].some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isWordLibraryRoute = pathname === "/word-library" || pathname.startsWith("/word-library/");

  return (
    <div className="app-frame">
      <Navbar />
      <main
        className={cn(
          "app-main mx-auto max-w-6xl px-4 md:px-6",
          isBasicsRoute ? "py-3 md:py-4" : isWordLibraryRoute ? "pt-3 pb-5 md:pt-4 md:pb-6" : "py-5 md:py-8"
        )}
      >
        {storageWarning ? (
          <div className="mb-6 rounded-[1.5rem] border border-amber-200 bg-[linear-gradient(145deg,#fff6de,#ffeab5)] px-4 py-4 text-sm text-amber-900 shadow-soft">
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
