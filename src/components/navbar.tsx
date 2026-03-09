"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

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

  return (
    <header className="sticky top-0 z-20 border-b border-white/60 bg-shell/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
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
        <nav className="hidden gap-2 rounded-full bg-white/70 p-1 md:flex">
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
      </div>
    </header>
  );
}
