"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ExamModePanel } from "@/features/challenge/exam-mode-panel";
import { Shell } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";

export function ChallengeScreen() {
  return (
    <Shell>
      <div className="space-y-6">
        <Link href="/" className="inline-flex">
          <Button variant="secondary">
            <ChevronLeft className="mr-2 h-4 w-4" />
            返回主页
          </Button>
        </Link>

        <SectionHeading
          eyebrow="Challenge"
          title="闯关地图"
          description="这里单独保留地图、星级和闯关错题库。世界切换、关卡进行中状态和结算结果都会按账户持久化。"
        />

        <ExamModePanel />
      </div>
    </Shell>
  );
}
