"use client";

import Link from "next/link";
import {
  BookOpenText,
  ChevronLeft,
  Flag,
  NotebookTabs,
  Sparkles,
  UserCircle2,
  type LucideIcon
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLearningStore } from "@/stores/learning-store";

type PrimaryNavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  matches: string[];
};

type HeaderConfig = {
  title?: string;
  tabs?: { href: string; label: string }[];
  backHref?: string;
  backLabel?: string;
};

const studyTabs = [
  { href: "/vocabulary", label: "\u5355\u8bcd" },
  { href: "/sentences", label: "\u53e5\u5b50" },
  { href: "/reading", label: "\u77ed\u6587" },
  { href: "/expressions", label: "\u8868\u8fbe" },
  { href: "/challenge", label: "\u95ef\u5173" },
  { href: "/test", label: "\u6d4b\u8bd5" },
  { href: "/review", label: "\u590d\u4e60" },
  { href: "/settings", label: "\u8bbe\u7f6e" }
] as const;

const primaryNavItems: PrimaryNavItem[] = [
  {
    href: "/vocabulary",
    label: "\u57fa\u7840",
    shortLabel: "\u57fa\u7840",
    icon: BookOpenText,
    matches: ["/vocabulary", "/sentences", "/reading", "/expressions"]
  },
  {
    href: "/word-library",
    label: "\u8bcd\u5e93",
    shortLabel: "\u8bcd\u5e93",
    icon: Sparkles,
    matches: ["/word-library"]
  },
  {
    href: "/challenge",
    label: "\u95ef\u5173",
    shortLabel: "\u95ef\u5173",
    icon: Flag,
    matches: ["/challenge"]
  },
  {
    href: "/test",
    label: "\u6d4b\u8bd5",
    shortLabel: "\u6d4b\u8bd5",
    icon: NotebookTabs,
    matches: ["/test", "/review"]
  },
  {
    href: "/account",
    label: "\u6211\u7684",
    shortLabel: "\u6211\u7684",
    icon: UserCircle2,
    matches: ["/account", "/stats", "/settings", "/achievements", "/version-log"]
  }
];

function matchesRoute(pathname: string, candidates: string[]) {
  return candidates.some((candidate) => pathname === candidate || pathname.startsWith(`${candidate}/`));
}

function getHeaderConfig(pathname: string): HeaderConfig {
  if (
    matchesRoute(pathname, [
      "/vocabulary",
      "/sentences",
      "/reading",
      "/expressions",
      "/challenge",
      "/test",
      "/review",
      "/settings"
    ])
  ) {
    return {
      tabs: [...studyTabs]
    };
  }

  if (matchesRoute(pathname, ["/account"])) {
    return { title: "\u6211\u7684" };
  }

  if (matchesRoute(pathname, ["/stats"])) {
    return { title: "\u7edf\u8ba1", backHref: "/account", backLabel: "\u8fd4\u56de\u6211\u7684" };
  }

  if (matchesRoute(pathname, ["/settings"])) {
    return { title: "\u8bbe\u7f6e", backHref: "/account", backLabel: "\u8fd4\u56de\u6211\u7684" };
  }

  if (matchesRoute(pathname, ["/version-log"])) {
    return { title: "\u7248\u672c\u65e5\u5fd7", backHref: "/settings", backLabel: "\u8fd4\u56de\u8bbe\u7f6e" };
  }

  if (matchesRoute(pathname, ["/achievements"])) {
    return { title: "\u6210\u5c31", backHref: "/account", backLabel: "\u8fd4\u56de\u6211\u7684" };
  }

  return {};
}

function PrimaryNavLinks({ pathname, mobile = false }: { pathname: string; mobile?: boolean }) {
  const lastVisitedTabs = useLearningStore((state) => state.userConfig.lastVisitedTabs);
  const persistNow = useLearningStore((state) => state.persistNow);

  return (
    <>
      {primaryNavItems.map((item) => {
        const active = matchesRoute(pathname, item.matches);
        const Icon = item.icon;
        const href = item.href === "/vocabulary" ? lastVisitedTabs.basics : item.href;

        return (
          <Link
            key={item.href}
            href={href}
            onClick={() => persistNow()}
            className={cn(
              "inline-flex items-center justify-center gap-2 text-sm font-semibold transition active:translate-y-px",
              mobile ? "flex-col gap-1 rounded-3xl px-1.5 py-2.5" : "rounded-3xl px-3 py-2",
              active ? "theme-nav-chip-active shadow-glass" : "theme-nav-chip hover:text-ink"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className={cn(mobile ? "text-[11px] leading-none" : "text-xs md:text-sm")}>
              {mobile ? item.shortLabel : item.label}
            </span>
          </Link>
        );
      })}
    </>
  );
}

function StudyTabs({ pathname }: { pathname: string }) {
  const persistNow = useLearningStore((state) => state.persistNow);
  const tabs = getHeaderConfig(pathname).tabs ?? [];

  return (
    <header className="theme-header-chrome sticky top-0 z-40">
      <div className="app-header-safe">
        <div className="mx-auto max-w-6xl px-4 pb-1.5 pt-1.5 md:px-6">
          <div className="theme-nav-surface flex gap-2 overflow-x-auto rounded-[1.25rem] p-1.5 scrollbar-none">
            {tabs.map((tab) => {
              const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => persistNow()}
                  className={cn(
                    "min-w-[72px] whitespace-nowrap rounded-3xl px-4 py-2 text-center text-sm font-semibold transition active:translate-y-px",
                    active ? "theme-nav-chip-active" : "theme-nav-chip hover:text-ink"
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}

export function Navbar() {
  const pathname = usePathname() || "/";
  const persistNow = useLearningStore((state) => state.persistNow);
  const headerConfig = getHeaderConfig(pathname);
  const hasStudyTabs = Boolean(headerConfig.tabs?.length);
  const isWordLibraryRoute = matchesRoute(pathname, ["/word-library"]);
  const isHomeRoute = pathname === "/";

  if (isHomeRoute) {
    return null;
  }

  if (isWordLibraryRoute) {
    return (
      <nav className="theme-header-chrome fixed inset-x-0 bottom-0 z-50 md:hidden">
        <div className="app-bottom-safe">
          <div className="theme-nav-surface mx-2 mb-2 grid grid-cols-5 gap-1 rounded-[1.9rem] px-2 pt-2">
            <PrimaryNavLinks pathname={pathname} mobile />
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      {hasStudyTabs ? (
        <StudyTabs pathname={pathname} />
      ) : (
        <header className="theme-header-chrome sticky top-0 z-40">
          <div className="app-header-safe">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-1.5 md:px-6">
              <div className="flex min-w-0 items-center gap-2">
                {headerConfig.backHref ? (
                  <Link
                    href={headerConfig.backHref}
                    onClick={() => persistNow()}
                    className="theme-nav-chip inline-flex h-9 w-9 items-center justify-center rounded-2xl transition hover:text-ink"
                    aria-label={headerConfig.backLabel ?? "\u8fd4\u56de"}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Link>
                ) : null}
                {headerConfig.title ? (
                  <p className="truncate text-sm font-bold text-ink md:text-base">{headerConfig.title}</p>
                ) : null}
              </div>

              <div className="hidden md:block">
                <div className="theme-nav-surface flex items-center gap-2 rounded-[1.25rem] p-1.5">
                  <PrimaryNavLinks pathname={pathname} />
                </div>
              </div>
            </div>

            {headerConfig.tabs?.length ? (
              <div className="mx-auto max-w-6xl px-4 pb-1.5 md:px-6">
                <div className="theme-nav-surface flex gap-2 overflow-x-auto rounded-[1.25rem] p-1.5 scrollbar-none">
                  {headerConfig.tabs.map((tab) => {
                    const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);

                    return (
                      <Link
                        key={tab.href}
                        href={tab.href}
                        onClick={() => persistNow()}
                        className={cn(
                          "whitespace-nowrap rounded-3xl px-4 py-2 text-sm font-semibold transition active:translate-y-px",
                          active ? "theme-nav-chip-active" : "theme-nav-chip hover:text-ink"
                        )}
                      >
                        {tab.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </header>
      )}

      <nav className="theme-header-chrome fixed inset-x-0 bottom-0 z-50 md:hidden">
        <div className="app-bottom-safe">
          <div className="theme-nav-surface mx-2 mb-2 grid grid-cols-5 gap-1 rounded-[1.9rem] px-2 pt-2">
            <PrimaryNavLinks pathname={pathname} mobile />
          </div>
        </div>
      </nav>
    </>
  );
}
