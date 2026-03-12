"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PracticeModeKey = "review" | "test" | "challenge";

const modeItems: Array<{
  id: PracticeModeKey;
  href: string;
  title: string;
  description: string;
}> = [
  {
    id: "review",
    href: "/review",
    title: "复习模式",
    description: "回放当前错题池，并继续把做错的题追踪下去。"
  },
  {
    id: "test",
    href: "/test",
    title: "测试模式",
    description: "把单词和句子串成连续测验，错题直接送入复习。"
  },
  {
    id: "challenge",
    href: "/challenge",
    title: "闯关模式",
    description: "进入地图闯关，只用词汇世界做关卡推进和星级结算。"
  }
];

export function PracticeModeNav({ active }: { active: PracticeModeKey }) {
  return (
    <div className="rounded-[2rem] bg-white/80 p-3 ring-1 ring-slate-200/80">
      <div className="grid gap-2 md:grid-cols-3" data-testid="practice-mode-nav">
        {modeItems.map((item) => {
          const isActive = active === item.id;

          return (
            <Link key={item.id} href={item.href} className="block">
              <Card
                className={cn(
                  "h-full rounded-[1.5rem] border-0 px-4 py-4 shadow-none transition",
                  isActive
                    ? "bg-gradient-to-r from-surge to-sky text-white shadow-glass"
                    : "bg-slate-50 text-slate-600 hover:-translate-y-0.5"
                )}
              >
                <p className="text-sm font-semibold">{item.title}</p>
                <p
                  className={cn(
                    "mt-2 text-sm leading-6",
                    isActive ? "text-white/90" : "text-slate-500"
                  )}
                >
                  {item.description}
                </p>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
