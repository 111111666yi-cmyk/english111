"use client";

import Link from "next/link";
import { LogOut, UserCircle2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";

const links = [
  { href: "/", label: "首页" },
  { href: "/vocabulary", label: "单词" },
  { href: "/sentences", label: "句子" },
  { href: "/reading", label: "短文" },
  { href: "/expressions", label: "表达" },
  { href: "/review", label: "复习" },
  { href: "/stats", label: "统计" },
  { href: "/settings", label: "设置" }
];

export function Navbar() {
  const pathname = usePathname();
  const authHydrated = useAuthStore((state) => state.hydrated);
  const currentUsername = useAuthStore((state) => state.currentUsername);
  const logout = useAuthStore((state) => state.logout);

  return (
    <header className="sticky top-0 z-20 border-b border-white/60 bg-shell/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:px-8 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-surge to-sky text-lg font-black text-white">
            EC
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-surge">
              English Climb
            </p>
            <p className="text-xs text-slate-500">英语阶梯学习站</p>
          </div>
        </Link>

        <div className="flex flex-col gap-3 lg:items-end">
          <nav className="flex flex-wrap gap-2 rounded-3xl bg-white/70 p-1">
            {links.map((link) => {
              const active = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition",
                    active && "bg-surge text-white shadow-glass"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm text-slate-600 ring-1 ring-slate-200">
              <UserCircle2 className="h-4 w-4 text-surge" />
              <span className="font-medium text-ink">
                {authHydrated
                  ? currentUsername
                    ? `账户：${currentUsername}`
                    : "当前：访客模式"
                  : "正在载入账户"}
              </span>
            </div>
            <Link href="/account">
              <Button variant="secondary">
                {authHydrated && currentUsername ? "切换账户" : "登录 / 注册"}
              </Button>
            </Link>
            {authHydrated && currentUsername ? (
              <Button type="button" variant="ghost" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                退出
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
