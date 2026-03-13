"use client";

import Link from "next/link";
import {
  BookOpenText,
  ChevronLeft,
  Flag,
  LogIn,
  NotebookTabs,
  Sparkles,
  UserCircle2,
  type LucideIcon
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

type PrimaryNavItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  matches: string[];
};

type HeaderConfig = {
  title: string;
  eyebrow?: string;
  tabs?: { href: string; label: string }[];
  backHref?: string;
  backLabel?: string;
};

const primaryNavItems: PrimaryNavItem[] = [
  {
    href: "/vocabulary",
    label: "\u5b66\u57fa\u7840",
    shortLabel: "\u57fa\u7840",
    icon: BookOpenText,
    matches: ["/vocabulary", "/sentences"]
  },
  {
    href: "/reading",
    label: "\u5b66\u8fdb\u9636",
    shortLabel: "\u8fdb\u9636",
    icon: Sparkles,
    matches: ["/reading", "/expressions"]
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
    label: "\u6d4b\u8bd5 / \u590d\u4e60",
    shortLabel: "\u6d4b\u8bd5",
    icon: NotebookTabs,
    matches: ["/test", "/review"]
  },
  {
    href: "/account",
    label: "\u6211\u7684",
    shortLabel: "\u6211\u7684",
    icon: UserCircle2,
    matches: ["/account", "/stats", "/settings", "/achievements", "/word-library", "/reading-library"]
  }
];

function matchesRoute(pathname: string, candidates: string[]) {
  return candidates.some((candidate) => pathname === candidate || pathname.startsWith(`${candidate}/`));
}

function getHeaderConfig(pathname: string): HeaderConfig {
  if (matchesRoute(pathname, ["/vocabulary", "/sentences"])) {
    return {
      title: "\u5b66\u57fa\u7840",
      eyebrow: "Basics",
      tabs: [
        { href: "/vocabulary", label: "\u5355\u8bcd" },
        { href: "/sentences", label: "\u53e5\u5b50" }
      ]
    };
  }

  if (matchesRoute(pathname, ["/reading", "/expressions"])) {
    return {
      title: "\u5b66\u8fdb\u9636",
      eyebrow: "Advanced",
      tabs: [
        { href: "/reading", label: "\u77ed\u6587" },
        { href: "/expressions", label: "\u8fdb\u9636\u8868\u8fbe" }
      ]
    };
  }

  if (matchesRoute(pathname, ["/test", "/review"])) {
    return {
      title: "\u6d4b\u8bd5 / \u590d\u4e60",
      eyebrow: "Practice",
      tabs: [
        { href: "/test", label: "\u6d4b\u8bd5" },
        { href: "/review", label: "\u590d\u4e60" }
      ]
    };
  }

  if (matchesRoute(pathname, ["/challenge"])) {
    return { title: "\u95ef\u5173", eyebrow: "Challenge" };
  }

  if (matchesRoute(pathname, ["/account"])) {
    return { title: "\u6211\u7684", eyebrow: "Profile" };
  }

  if (matchesRoute(pathname, ["/stats"])) {
    return {
      title: "\u7edf\u8ba1",
      eyebrow: "Stats",
      backHref: "/account",
      backLabel: "\u8fd4\u56de\u6211\u7684"
    };
  }

  if (matchesRoute(pathname, ["/settings"])) {
    return {
      title: "\u8bbe\u7f6e",
      eyebrow: "Settings",
      backHref: "/account",
      backLabel: "\u8fd4\u56de\u6211\u7684"
    };
  }

  if (matchesRoute(pathname, ["/achievements"])) {
    return {
      title: "\u6210\u5c31",
      eyebrow: "Achievements",
      backHref: "/account",
      backLabel: "\u8fd4\u56de\u6211\u7684"
    };
  }

  if (matchesRoute(pathname, ["/word-library"])) {
    return {
      title: "\u8bcd\u6c47\u603b\u89c8",
      eyebrow: "Vocabulary Library",
      backHref: "/account",
      backLabel: "\u8fd4\u56de\u6211\u7684"
    };
  }

  if (matchesRoute(pathname, ["/reading-library"])) {
    return {
      title: "\u77ed\u6587\u76ee\u5f55",
      eyebrow: "Reading Library",
      backHref: "/account",
      backLabel: "\u8fd4\u56de\u6211\u7684"
    };
  }

  return {
    title: "English Climb",
    eyebrow: "Today"
  };
}

function PrimaryNavLinks({ pathname, mobile = false }: { pathname: string; mobile?: boolean }) {
  return (
    <>
      {primaryNavItems.map((item) => {
        const active = matchesRoute(pathname, item.matches);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition",
              mobile ? "flex-col gap-1 rounded-2xl px-1.5 py-2" : "px-4 py-2",
              active
                ? "bg-surge text-white shadow-glass"
                : "text-slate-500 hover:bg-white/80 hover:text-ink"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className={cn(mobile ? "text-[11px] leading-none" : "")}>
              {mobile ? item.shortLabel : item.label}
            </span>
          </Link>
        );
      })}
    </>
  );
}

export function Navbar() {
  const pathname = usePathname() || "/";
  const authHydrated = useAuthStore((state) => state.hydrated);
  const currentUsername = useAuthStore((state) => state.currentUsername);
  const headerConfig = getHeaderConfig(pathname);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/70 bg-shell/95 shadow-soft backdrop-blur supports-[backdrop-filter]:bg-shell/90">
        <div className="app-header-safe">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <div className="flex items-center justify-between gap-3 py-2.5 md:py-3">
              <div className="flex min-w-0 items-center gap-3">
                {headerConfig.backHref ? (
                  <Link
                    href={headerConfig.backHref}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white/90 text-slate-600 shadow-sm transition hover:text-ink"
                    aria-label={headerConfig.backLabel ?? "\u8fd4\u56de"}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Link>
                ) : (
                  <Link
                    href="/"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-surge to-sky text-sm font-black text-white shadow-glass"
                    aria-label="\u8fd4\u56de\u9996\u9875"
                  >
                    EC
                  </Link>
                )}
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-surge/75 md:text-[11px]">
                    {headerConfig.eyebrow}
                  </p>
                  <h1 className="truncate text-base font-black text-ink md:text-xl">{headerConfig.title}</h1>
                </div>
              </div>

              <div className="hidden min-w-0 items-center gap-3 md:flex">
                <nav className="flex items-center gap-2 rounded-full bg-white/75 p-1 shadow-soft">
                  <PrimaryNavLinks pathname={pathname} />
                </nav>
                <Link
                  href="/account"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-sm text-slate-500 shadow-sm transition hover:text-ink"
                >
                  <UserCircle2 className="h-4 w-4 text-surge" />
                  <span className="max-w-[180px] truncate font-medium text-ink">
                    {currentUsername
                      ? currentUsername
                      : authHydrated
                        ? "\u8bbf\u5ba2\u6a21\u5f0f"
                        : "\u6b63\u5728\u52a0\u8f7d"}
                  </span>
                </Link>
              </div>

              <div className="md:hidden">
                <Link
                  href="/account"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white/90 text-slate-600 shadow-sm"
                  aria-label="\u6253\u5f00\u6211\u7684"
                >
                  {currentUsername ? (
                    <UserCircle2 className="h-5 w-5 text-surge" />
                  ) : (
                    <LogIn className="h-5 w-5 text-surge" />
                  )}
                </Link>
              </div>
            </div>

            {headerConfig.tabs?.length ? (
              <div className="pb-2.5 md:pb-3">
                <div className="flex gap-2 overflow-x-auto scrollbar-none">
                  {headerConfig.tabs.map((tab) => {
                    const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);

                    return (
                      <Link
                        key={tab.href}
                        href={tab.href}
                        className={cn(
                          "whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition",
                          active ? "bg-ink text-white shadow-glass" : "bg-white/80 text-slate-500 hover:text-ink"
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
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/70 bg-shell/95 shadow-[0_-16px_30px_rgba(16,32,51,0.08)] backdrop-blur supports-[backdrop-filter]:bg-shell/90 md:hidden">
        <div className="app-bottom-safe">
          <div className="grid grid-cols-5 gap-1 px-3 pt-2">
            <PrimaryNavLinks pathname={pathname} mobile />
          </div>
        </div>
      </nav>
    </>
  );
}
