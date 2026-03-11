"use client";

import { Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AchievementItem } from "@/lib/achievements";

export function AchievementPanel({ items }: { items: AchievementItem[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {items.map((item) => (
        <Card
          key={item.id}
          className={cn(
            "space-y-3 transition",
            item.unlocked ? "bg-white ring-1 ring-surge/20" : "bg-slate-50/80"
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-bold text-ink">{item.title}</p>
              <p className="mt-1 text-sm text-slate-500">{item.description}</p>
            </div>
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-2xl",
                item.unlocked ? "bg-gradient-to-br from-surge to-sky text-white" : "bg-slate-200 text-slate-500"
              )}
            >
              <Trophy className="h-5 w-5" />
            </div>
          </div>
          <p className={cn("text-sm font-semibold", item.unlocked ? "text-surge" : "text-slate-500")}>
            {item.unlocked ? "已达成" : item.progressLabel}
          </p>
        </Card>
      ))}
    </div>
  );
}
