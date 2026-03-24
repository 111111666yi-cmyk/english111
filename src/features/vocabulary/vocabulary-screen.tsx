"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Volume2 } from "lucide-react";
import { AudioButton } from "@/components/audio-button";
import { HighlightedText } from "@/components/highlighted-text";
import { QuizCard } from "@/components/quiz-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shell } from "@/components/shell";
import { getVocabularyQuiz } from "@/data/quizzes";
import { playPreferredLocalAudio } from "@/lib/audio";
import { releaseWordCount, releaseWords } from "@/lib/content";
import { createEmptyQuizSession } from "@/lib/quiz-session";
import { resolveChineseHighlights } from "@/lib/quiz-support";
import { useLearningStore } from "@/stores/learning-store";

export function VocabularyScreen() {
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [exampleAudioStatus, setExampleAudioStatus] = useState("");
  const hydrated = useLearningStore((state) => state.hydrated);
  const activeMode = useLearningStore((state) => state.modeConfig.activeMode);
  const speechEnabled = useLearningStore((state) => state.settings.speechEnabled);
  const session = useLearningStore((state) => state.vocabularySession);
  const markWord = useLearningStore((state) => state.markWord);
  const logDailyProgress = useLearningStore((state) => state.logDailyProgress);
  const recordQuizResult = useLearningStore((state) => state.recordQuizResult);
  const updateVocabularySession = useLearningStore((state) => state.updateVocabularySession);
  const updateVocabularyQuizSession = useLearningStore((state) => state.updateVocabularyQuizSession);

  const currentIndex = releaseWords.length ? Math.min(session.currentIndex, releaseWords.length - 1) : 0;
  const currentWord = releaseWords[currentIndex] ?? releaseWords[0];
  const quiz = getVocabularyQuiz(currentIndex, activeMode);

  const exampleHighlightsEn = useMemo(
    () => (currentWord.exampleHighlightsEn?.length ? currentWord.exampleHighlightsEn : [currentWord.word]),
    [currentWord.exampleHighlightsEn, currentWord.word]
  );
  const exampleFocusZh = currentWord.exampleFocusZh ?? currentWord.meaningZh;
  const exampleHighlightsZh = useMemo(() => {
    if (currentWord.exampleHighlightsZh?.length) {
      return currentWord.exampleHighlightsZh;
    }

    const resolved = resolveChineseHighlights(currentWord.exampleZh, [exampleFocusZh]);
    return resolved.length ? resolved : [exampleFocusZh];
  }, [currentWord.exampleHighlightsZh, currentWord.exampleZh, exampleFocusZh]);

  useEffect(() => {
    setDetailsExpanded(false);
    setExampleAudioStatus("");
  }, [activeMode, currentWord.id]);

  if (!hydrated) {
    return (
      <Shell>
        <div className="py-10 text-sm theme-secondary-text">加载学习进度中...</div>
      </Shell>
    );
  }

  if (!currentWord) {
    return (
      <Shell>
        <Card className="space-y-3 rounded-[1.5rem] p-5">
          <h2 className="text-2xl font-black text-ink">正式学习词库暂未生成</h2>
          <p className="text-sm text-slate-500">请先完成发布白名单审计，生成可上架词库后再进入词汇学习。</p>
        </Card>
      </Shell>
    );
  }

  const goNext = () =>
    updateVocabularySession({
      currentIndex: currentIndex + 1 >= releaseWords.length ? 0 : currentIndex + 1,
      quiz: createEmptyQuizSession()
    });

  const goPrevious = () =>
    updateVocabularySession({
      currentIndex: currentIndex - 1 < 0 ? releaseWords.length - 1 : currentIndex - 1,
      quiz: createEmptyQuizSession()
    });

  const playExampleAudio = async () => {
    const result = await playPreferredLocalAudio({
      cacheKey: `word-example-${currentWord.id}`,
      localPath: currentWord.exampleAudioLocal,
      text: currentWord.exampleEn,
      allowSpeechFallback: speechEnabled
    });

    setExampleAudioStatus(
      result.ok
        ? result.reason ??
            (result.source === "local" ? "已播放本地例句发音。" : "本地例句缺失，已切换本机朗读。")
        : result.reason ?? "例句发音暂时不可用。"
    );
  };

  return (
    <Shell>
      <div className="space-y-3">
        <Card className="space-y-4 rounded-[1.5rem] p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] theme-secondary-text">
              <span>{activeMode === "simple" ? "基础模式" : "困难模式"}</span>
              <span>{currentWord.level}</span>
              <span>
                {currentIndex + 1}/{releaseWordCount}
              </span>
              <span>{currentWord.partOfSpeech}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" className="h-9 min-w-9 px-3" onClick={goPrevious}>
                {"<"}
              </Button>
              <Button type="button" variant="secondary" className="h-9 min-w-9 px-3" onClick={goNext}>
                {">"}
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr] md:items-start">
            <div className="space-y-3">
              <h1 className="text-[2.35rem] font-black leading-none theme-primary-text md:text-[3rem]">
                {currentWord.word}
              </h1>

              <div className="flex flex-wrap items-center gap-2">
                {currentWord.phonetic ?? currentWord.pronunciationText ? (
                  <button
                    type="button"
                    onClick={() => {
                      void playPreferredLocalAudio({
                        cacheKey: `word-header-${currentWord.id}`,
                        localPath: currentWord.audioLocal,
                        text: currentWord.pronunciationText ?? currentWord.word,
                        allowSpeechFallback: speechEnabled
                      });
                    }}
                    className="theme-inline-pill inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold theme-secondary-text"
                  >
                    <Volume2 className="h-4 w-4 text-surge" />
                    {currentWord.phonetic ?? currentWord.pronunciationText}
                  </button>
                ) : null}
              </div>

              <AudioButton
                audioRef={{
                  kind: "word",
                  cacheKey: `word-main-${currentWord.id}`,
                  localPath: currentWord.audioLocal,
                  text: currentWord.pronunciationText ?? currentWord.word
                }}
                localLabel="单词发音"
                showCloud={false}
              />

              {activeMode === "simple" ? (
                <p className="text-lg font-semibold theme-primary-text">{currentWord.meaningZh}</p>
              ) : (
                <div className="theme-inline-panel rounded-2xl border border-dashed px-3 py-3">
                  <p className="text-sm font-semibold theme-primary-text">释义默认隐藏</p>
                  <p className="mt-1 text-sm theme-secondary-text">先回忆，再主动展开释义、例句和翻译。</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="theme-inline-panel-strong rounded-[1.2rem] px-3.5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold theme-primary-text">例句与补充</p>
                    <p className="mt-1 text-xs theme-secondary-text">
                      展开后查看本词落点、独立例句、中文翻译和折叠内句子发音。
                    </p>
                  </div>
                  <button
                    type="button"
                    className="theme-inline-icon-button inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition"
                    onClick={() => setDetailsExpanded((value) => !value)}
                    aria-label={detailsExpanded ? "收起例句与补充" : "展开例句与补充"}
                  >
                    {detailsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>

                {detailsExpanded ? (
                  <div className="mt-3 space-y-2.5">
                    <div className="theme-inline-panel rounded-2xl px-3 py-2.5">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] theme-secondary-text">本句中表示</p>
                      <p className="mt-1 text-sm font-semibold theme-primary-text">
                        <HighlightedText text={exampleFocusZh} highlights={[exampleFocusZh]} />
                      </p>
                    </div>

                    <div className="theme-inline-panel rounded-2xl px-3 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] theme-secondary-text">Example</p>
                        <button
                          type="button"
                          onClick={() => void playExampleAudio()}
                          className="theme-inline-icon-button inline-flex h-8 w-8 items-center justify-center rounded-full transition"
                          aria-label="播放例句发音"
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="mt-2 text-sm leading-6 theme-primary-text">
                        <HighlightedText text={currentWord.exampleEn} highlights={exampleHighlightsEn} />
                      </p>
                      {exampleAudioStatus ? (
                        <p className="mt-2 text-xs theme-secondary-text">{exampleAudioStatus}</p>
                      ) : null}
                    </div>

                    <div className="theme-inline-panel rounded-2xl px-3 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] theme-secondary-text">Translation</p>
                      <p className="mt-2 text-sm leading-6 theme-secondary-text">
                        <HighlightedText text={currentWord.exampleZh} highlights={exampleHighlightsZh} />
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </Card>

        <QuizCard
          quiz={quiz}
          autoAdvance="correct"
          sessionState={session.quiz}
          onSessionStateChange={updateVocabularyQuizSession}
          onAdvance={goNext}
          onResult={(correct) => {
            recordQuizResult(quiz.id, correct);
            markWord(currentWord.id, correct ? "known" : "unknown");
            logDailyProgress({
              words: 1,
              sentences: 0,
              passages: 0,
              reviews: 0,
              correct: correct ? 1 : 0,
              total: 1
            });
          }}
          compact
        />
      </div>
    </Shell>
  );
}
