"use client";

import { useEffect, useMemo, useRef } from "react";
import { Shell } from "@/components/shell";
import { words } from "@/lib/content";
import { cn } from "@/lib/utils";
import { useLearningStore } from "@/stores/learning-store";

const PAGE_SIZE = 48;

function getMasteryState(wordId: string, knownWords: string[]) {
  return knownWords.includes(wordId)
    ? { label: "已掌握", active: true }
    : { label: "未标记", active: false };
}

export function WordLibraryScreen() {
  const restoredScrollRef = useRef(false);
  const hydrated = useLearningStore((state) => state.hydrated);
  const knownWords = useLearningStore((state) => state.knownWords);
  const session = useLearningStore((state) => state.wordLibrarySession);
  const updateWordLibrarySession = useLearningStore((state) => state.updateWordLibrarySession);

  const filter = session.filter.trim().toLowerCase();
  const filteredWords = useMemo(() => {
    if (!filter) {
      return words;
    }

    return words.filter((word) => {
      return word.word.toLowerCase().includes(filter) || word.meaningZh.toLowerCase().includes(filter);
    });
  }, [filter]);

  const totalPages = Math.max(1, Math.ceil(filteredWords.length / PAGE_SIZE));
  const currentPage = Math.min(session.page, totalPages - 1);

  const visibleWords = useMemo(() => {
    const start = currentPage * PAGE_SIZE;
    return filteredWords.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredWords]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (currentPage !== session.page) {
      updateWordLibrarySession({ page: currentPage });
    }
  }, [currentPage, hydrated, session.page, updateWordLibrarySession]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const handleScroll = () => {
      updateWordLibrarySession({ scrollY: window.scrollY });
    };

    if (!restoredScrollRef.current) {
      const restore = window.requestAnimationFrame(() => {
        window.scrollTo({ top: session.scrollY, behavior: "auto" });
        restoredScrollRef.current = true;
      });

      window.addEventListener("scroll", handleScroll, { passive: true });

      return () => {
        window.cancelAnimationFrame(restore);
        window.removeEventListener("scroll", handleScroll);
      };
    }

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [hydrated, session.scrollY, updateWordLibrarySession]);

  if (!hydrated) {
    return (
      <Shell>
        <div className="py-10 text-sm text-slate-500">加载词库中...</div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-3">
        <div
          className="flex items-center gap-2"
          style={{ paddingTop: "max(env(safe-area-inset-top), 0.9rem)" }}
        >
          <input
            data-testid="word-library-search"
            type="search"
            value={session.filter}
            onChange={(event) => {
              restoredScrollRef.current = false;
              window.scrollTo({ top: 0, behavior: "auto" });
              updateWordLibrarySession({
                filter: event.target.value,
                page: 0,
                scrollY: 0
              });
            }}
            placeholder="搜索单词或中文"
            className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-surge"
          />
          <div className="shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500">
            <span data-testid="word-library-page-indicator">{currentPage + 1}/{totalPages}</span>
          </div>
        </div>

        <div className="space-y-2" data-testid="word-library-list">
          {visibleWords.map((word) => {
            const mastery = getMasteryState(word.id, knownWords);

            return (
              <article
                key={word.id}
                data-testid="word-library-item"
                className={cn(
                  "rounded-2xl border bg-white px-3 py-3",
                  mastery.active ? "border-emerald-400" : "border-slate-200"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-black text-ink">{word.word}</p>
                    <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-600">{word.meaningZh}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                      {word.level}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-[11px] font-semibold",
                        mastery.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {mastery.label}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-2 pb-4">
          <button
            type="button"
            data-testid="word-library-prev"
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-surge/40 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={currentPage === 0}
            onClick={() => {
              restoredScrollRef.current = false;
              window.scrollTo({ top: 0, behavior: "auto" });
              updateWordLibrarySession({ page: Math.max(currentPage - 1, 0), scrollY: 0 });
            }}
          >
            {"<"}
          </button>
          <button
            type="button"
            data-testid="word-library-next"
            className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-surge/40 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={currentPage + 1 >= totalPages}
            onClick={() => {
              restoredScrollRef.current = false;
              window.scrollTo({ top: 0, behavior: "auto" });
              updateWordLibrarySession({
                page: Math.min(currentPage + 1, totalPages - 1),
                scrollY: 0
              });
            }}
          >
            {">"}
          </button>
        </div>
      </div>
    </Shell>
  );
}
