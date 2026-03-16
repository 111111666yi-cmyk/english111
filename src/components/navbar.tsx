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

const primaryNavItems: PrimaryNavItem[] = [
  {
    href: "/vocabulary",
    label: "基础",
    shortLabel: "基础",
    icon: BookOpenText,
    matches: ["/vocabulary", "/sentences", "/reading", "/expressions"]
  },
  {
    href: "/word-library",
    label: "词库",
    shortLabel: "词库",
    icon: Sparkles,
    matches: ["/word-library"]
  },
  {
    href: "/challenge",
    label: "闯关",
    shortLabel: "闯关",
    icon: Flag,
    matches: ["/challenge"]
  },
  {
    href: "/test",
    label: "测试",
    shortLabel: "测试",
    icon: NotebookTabs,
    matches: ["/test", "/review"]
  },
  {
    href: "/account",
    label: "我的",
    shortLabel: "我的",
    icon: UserCircle2,
    matches: ["/account", "/stats", "/settings", "/achievements", "/version-log"]
  }
];

function matchesRoute(pathname: string, candidates: string[]) {
  return candidates.some((candidate) => pathname === candidate || pathname.startsWith(`${candidate}/`));
}

function getHeaderConfig(pathname: string): HeaderConfig {
  if (matchesRoute(pathname, ["/vocabulary", "/sentences", "/reading", "/expressions"])) {
    return {
      tabs: [
        { href: "/vocabulary", label: "单词" },
        { href: "/sentences", label: "句子" },
        { href: "/reading", label: "短文" },
        { href: "/expressions", label: "表达" }
      ]
    };
  }

  if (matchesRoute(pathname, ["/test", "/review"])) {
    return {
      title: "测试",
      tabs: [
        { href: "/test", label: "测试" },
        { href: "/review", label: "复习" }
      ]
    };
  }

  if (matchesRoute(pathname, ["/challenge"])) {
    return { title: "闯关" };
  }

  if (matchesRoute(pathname, ["/account"])) {
    return { title: "我的" };
  }

  if (matchesRoute(pathname, ["/stats"])) {
    return { title: "统计", backHref: "/account", backLabel: "返回我的" };
  }

  if (matchesRoute(pathname, ["/settings"])) {
    return { title: "设置", backHref: "/account", backLabel: "返回我的" };
  }

  if (matchesRoute(pathname, ["/version-log"])) {
    return { title: "版本日志", backHref: "/settings", backLabel: "返回设置" };
  }

  if (matchesRoute(pathname, ["/achievements"])) {
    return { title: "成就", backHref: "/account", backLabel: "返回我的" };
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

function BasicsTabs({ pathname }: { pathname: string }) {
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
  const isBasicsRoute = matchesRoute(pathname, ["/vocabulary", "/sentences", "/reading", "/expressions"]);
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
      {isBasicsRoute ? (
        <BasicsTabs pathname={pathname} />
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
                    aria-label={headerConfig.backLabel ?? "返回"}
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
