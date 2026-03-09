"use client";

import { QuizCard } from "@/components/quiz-card";
import { PassageViewer } from "@/components/passage-viewer";
import { SectionHeading } from "@/components/ui/section-heading";
import { Shell } from "@/components/shell";
import { passages } from "@/lib/content";
import { useLearningStore } from "@/stores/learning-store";

export function ReadingScreen() {
  const passage = passages[0];
  const chineseAssist = useLearningStore((state) => state.settings.chineseAssist);
  const updateSetting = useLearningStore((state) => state.updateSetting);
  const completePassage = useLearningStore((state) => state.completePassage);
  const logDailyProgress = useLearningStore((state) => state.logDailyProgress);
  const recordQuizResult = useLearningStore((state) => state.recordQuizResult);

  return (
    <Shell>
      <div className="space-y-6">
        <SectionHeading
          eyebrow="Reading"
          title="小短文阅读"
          description="支持段落级和整篇级播放，中文辅助可切换，题后即时反馈。"
        />
        <PassageViewer
          passage={passage}
          chineseAssist={chineseAssist}
          onToggleChinese={() => updateSetting("chineseAssist", !chineseAssist)}
          onComplete={() => {
            completePassage(passage.id);
            logDailyProgress({
              words: 0,
              sentences: 0,
              passages: 1,
              reviews: 0,
              correct: 1,
              total: 1
            });
          }}
        />
        <div className="grid gap-4 xl:grid-cols-2">
          {passage.questions.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              onResult={(correct) => recordQuizResult(quiz.id, correct)}
            />
          ))}
        </div>
      </div>
    </Shell>
  );
}
