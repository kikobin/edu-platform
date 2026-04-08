"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { YouTubePlayer } from "@/components/lesson/YouTubePlayer";
import { useProgressStore } from "@/store/progressStore";
import { lessons } from "@/data/lessons";
import { cn } from "@/lib/utils";
import type { LessonStepDef, LessonProgress } from "@/types";

interface Props { params: { id: string } }

// ─── Step card (grid item) ────────────────────────────────────────────────────

function StepCard({
  step,
  index,
  isCurrent,
  isDone,
  isNext,
  isUnlocked,
  onClick,
}: {
  step: LessonStepDef;
  index: number;
  isCurrent: boolean;
  isDone: boolean;
  isNext: boolean;
  isUnlocked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!isUnlocked}
      className={cn(
        "relative flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all duration-200 w-full",
        isDone && !isCurrent
          ? "bg-success/6 border-success/25 hover:bg-success/10 cursor-pointer"
          : isCurrent
          ? "bg-primary-light border-primary/30 shadow-sm shadow-primary/10"
          : isNext
          ? "bg-white border-gray-200 hover:border-primary/30 hover:shadow-sm cursor-pointer"
          : "bg-gray-50 border-gray-100 cursor-not-allowed opacity-55"
      )}
    >
      {/* Status badge top-right */}
      {isDone && !isCurrent && (
        <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-success flex items-center justify-center">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      )}
      {!isUnlocked && (
        <span className="absolute top-3 right-3 text-gray-300 text-sm">🔒</span>
      )}
      {isNext && !isDone && (
        <span className="absolute top-3 right-3 text-[10px] font-black text-primary bg-primary-light px-1.5 py-0.5 rounded-full uppercase tracking-wide">
          Далее
        </span>
      )}

      {/* Step number + icon */}
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center text-xl",
        isDone && !isCurrent ? "bg-success/12"
        : isCurrent          ? "bg-primary/12"
        :                      "bg-gray-100"
      )}>
        {isDone && !isCurrent ? "✅" : step.icon}
      </div>

      {/* Label */}
      <div>
        <p className={cn(
          "font-bold text-sm leading-snug",
          isDone && !isCurrent ? "text-success"
          : isCurrent          ? "text-primary"
          : isNext             ? "text-text"
          :                      "text-text-muted"
        )}>
          {step.label}
        </p>
        <p className="text-[11px] text-text-muted mt-0.5 leading-snug line-clamp-2">
          {isDone ? step.doneTip : step.description}
        </p>
      </div>

      {/* XP */}
      <span className={cn(
        "text-[11px] font-black px-2 py-0.5 rounded-full mt-auto",
        isDone && !isCurrent ? "bg-success/10 text-success"
        : isCurrent          ? "bg-primary/10 text-primary"
        :                      "bg-gray-100 text-text-muted"
      )}>
        +{step.xpReward} XP
      </span>
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function VideoStepPage({ params }: Props) {
  const { id }  = params;
  const router  = useRouter();
  const { getLesson, markStepDone, isStepUnlocked } = useProgressStore();

  const lesson   = useMemo(() => lessons.find((l) => l.id === id), [id]);
  const stepDef  = useMemo(() => lesson?.steps.find((s) => s.type === "video"), [lesson]);
  const progress: LessonProgress = getLesson(id);
  const alreadyDone = progress.steps[stepDef?.id ?? "video"]?.done ?? false;

  const [watched, setWatched] = useState(alreadyDone);
  const markedRef = useRef(false);
  const isDone = watched || alreadyDone;

  // Always point to the first incomplete step after video (updates as steps get done)
  const nextStep = useMemo(() => {
    if (!lesson || !stepDef) return null;
    const afterVideo = lesson.steps.filter((s) => s.id !== stepDef.id);
    return afterVideo.find((s) => !(progress.steps[s.id]?.done)) ?? null;
  }, [lesson, stepDef, progress.steps]);

  const completedCount = lesson?.steps.filter((st) => progress.steps[st.id]?.done).length ?? 0;
  const totalCount     = lesson?.steps.length ?? 0;
  const earnedXP       = lesson?.steps.reduce((s, st) => s + (progress.steps[st.id]?.done ? st.xpReward : 0), 0) ?? 0;
  const totalXP        = lesson?.steps.reduce((s, st) => s + st.xpReward, 0) ?? 0;
  const firstIncomplete = lesson?.steps.findIndex((st) => !(progress.steps[st.id]?.done)) ?? -1;

  function handleWatchedEnough() {
    if (markedRef.current || alreadyDone) return;
    markedRef.current = true;
    setWatched(true);
    if (stepDef) markStepDone(id, stepDef.id, 100);
  }

  function handleStepClick(step: LessonStepDef) {
    if (isStepUnlocked(id, step.id)) {
      router.push(`/lesson/${id}/${step.route}`);
    }
  }

  // ── Fallback: no video ────────────────────────────────────────────────────
  if (lesson && stepDef && !stepDef.videoId) {
    return (
      <AppLayout hideNav>
        <div className="min-h-screen bg-[#F6F5FF]">
          <Header lesson={lesson} isDone={false} onBack={() => router.push("/dashboard")} />
          <div className="max-w-4xl mx-auto px-4 pt-5">
            <div className="rounded-2xl bg-gray-100 aspect-video flex flex-col items-center justify-center gap-3 shadow-sm">
              <span className="text-5xl">🎬</span>
              <p className="font-bold text-text">Видео скоро появится</p>
              <p className="text-sm text-text-muted">Преподаватель готовит материал</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!stepDef?.videoId || !lesson) {
    return (
      <AppLayout hideNav>
        <div className="min-h-screen bg-[#F6F5FF] flex items-center justify-center">
          <p className="text-text-muted">Урок не найден</p>
        </div>
      </AppLayout>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <AppLayout hideNav>
      <div className="min-h-screen bg-[#F6F5FF]">

        {/* ── Header ── */}
        <Header lesson={lesson} isDone={isDone} onBack={() => router.push("/dashboard")} />

        <div className="max-w-4xl mx-auto px-4 pt-5 pb-10 flex flex-col gap-5">

          {/* ── Video ── */}
          <div className="rounded-2xl overflow-hidden shadow-md shadow-primary/8 ring-1 ring-black/5">
            <YouTubePlayer videoId={stepDef.videoId} onWatchedEnough={handleWatchedEnough} />
          </div>

          {/* ── Progress + XP + CTA — one compact block ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
            <div className="flex items-center gap-4">

              {/* XP pill + progress bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{isDone ? "🎉" : "⚡"}</span>
                    <span className="font-bold text-sm text-text">
                      {isDone ? "Видео засчитано!" : `Посмотри видео — получишь +${stepDef.xpReward} XP`}
                    </span>
                  </div>
                  <span className={cn(
                    "text-xs font-black px-2.5 py-1 rounded-full shrink-0 ml-2",
                    isDone ? "bg-success/10 text-success" : "bg-primary-light text-primary"
                  )}>
                    {earnedXP} / {totalXP} XP
                  </span>
                </div>

                {/* Progress bar */}
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      isDone ? "bg-success" : "bg-primary"
                    )}
                    style={{ width: `${totalXP > 0 ? Math.round((earnedXP / totalXP) * 100) : 0}%` }}
                  />
                </div>
                <p className="text-[11px] text-text-muted mt-1.5">
                  {completedCount} из {totalCount} шагов выполнено
                </p>
              </div>

              {/* CTA */}
              {isDone && (
                <button
                  onClick={() =>
                    nextStep
                      ? router.push(`/lesson/${id}/${nextStep.route}`)
                      : router.push("/dashboard")
                  }
                  className="shrink-0 flex items-center gap-2 bg-primary text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-primary/90 active:scale-95 transition-all shadow-md shadow-primary/25"
                >
                  {nextStep ? nextStep.label : "Готово"}
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7h8M7.5 4l3 3-3 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* ── Steps ── */}
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-text-muted px-1 mb-3">
              Шаги урока
            </p>
            <div className={cn(
              "grid gap-3",
              totalCount <= 2 ? "grid-cols-2"
              : totalCount === 3 ? "grid-cols-3"
              : "grid-cols-2 sm:grid-cols-4"
            )}>
              {lesson.steps.map((step, i) => (
                <StepCard
                  key={step.id}
                  step={step}
                  index={i}
                  isCurrent={step.id === stepDef.id}
                  isDone={progress.steps[step.id]?.done ?? false}
                  isNext={i === firstIncomplete && step.id !== stepDef.id}
                  isUnlocked={isStepUnlocked(id, step.id)}
                  onClick={() => handleStepClick(step)}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({
  lesson,
  isDone,
  onBack,
}: {
  lesson: { title: string; order: number; topic: string };
  isDone: boolean;
  onBack: () => void;
}) {
  return (
    <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-text transition-colors px-2.5 py-1.5 rounded-xl hover:bg-gray-50 active:scale-95"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="hidden sm:inline">Назад</span>
        </button>

        <div className="h-4 w-px bg-gray-200" />

        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="shrink-0 text-[11px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full hidden sm:block">
            {lesson.topic}
          </span>
          <p className="text-sm font-bold text-text truncate">{lesson.title}</p>
        </div>

        {isDone && (
          <div className="shrink-0 flex items-center gap-1.5 text-success text-xs font-bold bg-success/8 border border-success/20 px-3 py-1.5 rounded-xl">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Просмотрено
          </div>
        )}
      </div>
    </div>
  );
}
