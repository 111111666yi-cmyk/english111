"use client";

import { useDeferredValue, useEffect, useMemo, useRef } from "react";
import { Shell } from "@/components/shell";
import { countReleaseWordIds, isReleaseWordId, releaseWordCount, words } from "@/lib/content";
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
  const scrollYRef = useRef(0);
  const scrollFrameRef = useRef<number | null>(null);
  const hydrated = useLearningStore((state) => state.hydrated);
  const knownWords = useLearningStore((state) => state.knownWords);
  const session = useLearningStore((state) => state.wordLibrarySession);
  const updateWordLibrarySession = useLearningStore((state) => state.updateWordLibrarySession);

  const filter = session.filter.trim().toLowerCase();
  const deferredFilter = useDeferredValue(filter);
  const isFiltering = filter !== deferredFilter;
  const releaseKnownWords = useMemo(() => countReleaseWordIds(knownWords), [knownWords]);
  const filteredWords = useMemo(() => {
    if (!deferredFilter) {
      return words;
    }

    return words.filter((word) => {
      return word.word.toLowerCase().includes(deferredFilter) || word.meaningZh.toLowerCase().includes(deferredFilter);
    });
  }, [deferredFilter]);

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
    scrollYRef.current = session.scrollY;
  }, [session.scrollY]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const restoreScrollY = scrollYRef.current;
    const persistScroll = () => {
      updateWordLibrarySession({ scrollY: scrollYRef.current });
    };

    const handleScroll = () => {
      if (scrollFrameRef.current !== null) {
        return;
      }

      scrollFrameRef.current = window.requestAnimationFrame(() => {
        scrollFrameRef.current = null;
        scrollYRef.current = window.scrollY;
      });
    };

    let restore = 0;
    if (!restoredScrollRef.current) {
      restore = window.requestAnimationFrame(() => {
        window.scrollTo({ top: restoreScrollY, behavior: "auto" });
        scrollYRef.current = restoreScrollY;
        restoredScrollRef.current = true;
      });
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("pagehide", persistScroll);

    return () => {
      if (restore) {
        window.cancelAnimationFrame(restore);
      }
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
        scrollFrameRef.current = null;
      }
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pagehide", persistScroll);
      persistScroll();
    };
  }, [hydrated, updateWordLibrarySession]);

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
              scrollYRef.current = 0;
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

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/80 bg-white/72 px-3 py-2 text-xs font-semibold text-slate-500">
          <span>{deferredFilter ? `匹配 ${filteredWords.length} 个结果` : `词库检索 ${words.length} 个 · 正式学习 ${releaseWordCount} 个`}</span>
          <span>{isFiltering ? "筛选中..." : `已掌握 ${releaseKnownWords} 个 · 仅正式学习词计入统计`}</span>
        </div>

        <div className="space-y-2" data-testid="word-library-list">
          {visibleWords.map((word) => {
            const mastery = getMasteryState(word.id, knownWords);
            const isReleaseWord = isReleaseWordId(word.id);

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
                    {!isReleaseWord ? (
                      <p className="mt-2 text-xs leading-5 text-amber-700">
                        该词保留在词库中，但不会进入正式学习、测试、复习、闯关和掌握统计。
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                      {word.level}
                    </span>
                    {!isReleaseWord ? (
                      <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
                        仅词库保留
                      </span>
                    ) : null}
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
              scrollYRef.current = 0;
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
              scrollYRef.current = 0;
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
