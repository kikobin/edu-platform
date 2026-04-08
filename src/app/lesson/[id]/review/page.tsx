"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { useProgressStore } from "@/store/progressStore";
import { contentRepository } from "@/lib/contentRepository";
import { lessons } from "@/data/lessons";
import { XP_REWARDS } from "@/types";
import { cn } from "@/lib/utils";

interface Props { params: { id: string } }

function HighlightBlock({ text, type }: { text: string; type?: string }) {
  if (type === "warning") {
    return (
      <div className="rounded-2xl p-4 bg-amber-50 border border-amber-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base leading-none">⚠️</span>
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600">Частая ошибка</span>
        </div>
        <p className="text-sm font-medium text-amber-900 leading-relaxed whitespace-pre-line">{text}</p>
      </div>
    );
  }
  if (type === "example") {
    return (
      <div className="rounded-2xl p-4 bg-emerald-50 border border-emerald-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base leading-none">✅</span>
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">Пример</span>
        </div>
        <p className="text-sm font-medium text-emerald-900 leading-relaxed whitespace-pre-line">{text}</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl p-4 bg-[linear-gradient(135deg,#ede9ff,#f7f4ff)] border border-primary/20">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base leading-none">⭐</span>
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-primary/70">Ключевое</span>
      </div>
      <p className="text-sm font-semibold text-primary leading-relaxed whitespace-pre-line">{text}</p>
    </div>
  );
}

const STEP_ICONS: Record<string, string> = {
  video: "🎬", review: "📖", practice: "✏️", homework: "📝", checkpoint: "🏆", project: "🛠️",
};

export default function ReviewPage({ params }: Props) {
  const { id }   = params;
  const router   = useRouter();
  const { getLesson, markReviewDone, setCurrentSlide, isLessonUnlocked, isStepUnlocked } = useProgressStore();

  const lesson       = useMemo(() => lessons.find((l) => l.id === id), [id]);
  const lessonSlides = useMemo(() => contentRepository.getSlides(id), [id]);
  const progress          = getLesson(id);
  const safeInitialSlide  = Math.min(Math.max(progress.currentSlide ?? 0, 0), Math.max(lessonSlides.length - 1, 0));
  const [current, setCurrent]     = useState(safeInitialSlide);
  const [direction, setDirection] = useState(1);
  const finishing = useRef(false);

  // Dynamic step index for display
  const reviewStepIdx = useMemo(
    () => lesson?.steps.findIndex((s) => s.id === "review") ?? 0,
    [lesson],
  );

  useEffect(() => {
    if (!isLessonUnlocked(id)) router.replace("/dashboard");
  }, [id, isLessonUnlocked, router]);

  if (!lessonSlides.length) {
    return (
      <AppLayout hideNav>
        <div className="min-h-screen bg-[#F6F5FF] flex items-center justify-center p-8">
          <div className="text-center">
            <span className="text-5xl mb-4 block">📖</span>
            <p className="font-bold text-text">Слайды ещё не добавлены</p>
            <p className="text-sm text-text-muted mt-1">Преподаватель скоро их подготовит</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!isLessonUnlocked(id)) return null;

  const total  = lessonSlides.length;
  const slide  = lessonSlides[current];
  if (!slide) return null;
  const isLast = current === total - 1;

  const goNext = () => {
    if (isLast) {
      if (finishing.current) return;
      finishing.current = true;
      markReviewDone(id); // emits lesson:step:completed → useLessonEvents awards XP
      router.push(`/lesson/${id}`);
      return;
    }
    setDirection(1);
    const n = current + 1;
    setCurrent(n);
    setCurrentSlide(id, n);
  };

  const goPrev = () => {
    if (current === 0) return;
    setDirection(-1);
    const n = current - 1;
    setCurrent(n);
    setCurrentSlide(id, n);
  };

  const goToSlide = (i: number) => {
    if (i === current) return;
    setDirection(i > current ? 1 : -1);
    setCurrent(i);
    setCurrentSlide(id, i);
  };

  return (
    <AppLayout hideNav>
      <div className="min-h-screen bg-[#F6F5FF]">
        <div className="max-w-5xl mx-auto px-4 md:px-8 pt-4 pb-8">

          {/* ── Шапка ── */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-text transition-colors px-3 py-2 rounded-xl hover:bg-white active:scale-95"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Назад
              </button>
              <div className="h-4 w-px bg-gray-200" />
              <div>
                <p className="text-xs text-text-muted font-medium">
                  Шаг {reviewStepIdx + 1} из {lesson?.steps.length ?? 3}
                </p>
                <h1 className="text-lg font-black text-text leading-tight">Повторение</h1>
              </div>
            </div>
            <span className="text-sm font-black text-text-muted tabular-nums bg-white px-3 py-1.5 rounded-xl border border-gray-100">
              {current + 1} <span className="text-text-subtle font-medium">/ {total}</span>
            </span>
          </div>

          {/* ── Шаги урока (динамические) ── */}
          {lesson && (
            <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-none">
              {lesson.steps.map((step, i) => {
                const isDone    = progress.steps[step.id]?.done ?? false;
                const isCurrent = step.id === "review";
                const unlocked  = isStepUnlocked(id, step.id);
                return (
                  <div key={step.id} className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => unlocked && router.push(`/lesson/${id}/${step.route}`)}
                      disabled={!unlocked}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all",
                        isDone    ? "bg-success/8 border-success/25 text-success hover:bg-success/14"
                        : isCurrent ? "bg-white border-primary/30 text-primary shadow-sm"
                        : unlocked  ? "bg-white/50 border-gray-200 text-text-muted hover:bg-white"
                        : "bg-gray-50 border-gray-100 text-text-subtle cursor-not-allowed opacity-60"
                      )}
                    >
                      <span className="text-sm leading-none">
                        {isDone && !isCurrent ? "✅" : !unlocked ? "🔒" : (STEP_ICONS[step.id] ?? "📌")}
                      </span>
                      <span className="hidden sm:block whitespace-nowrap">{step.label}</span>
                      {isCurrent && !isDone && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />}
                    </button>
                    {i < lesson.steps.length - 1 && (
                      <div className={cn("w-4 h-px shrink-0", isDone ? "bg-success/40" : "bg-gray-200")} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Основная сетка ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Слайд */}
            <div className="lg:col-span-2 flex flex-col">

              {/* Прогресс-сегменты */}
              <div className="flex gap-1 mb-4">
                {lessonSlides.map((_, i) => (
                  <motion.button
                    key={i}
                    onClick={() => goToSlide(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-colors duration-300 cursor-pointer",
                      i <= current ? "bg-primary" : "bg-gray-200 hover:bg-gray-300"
                    )}
                    animate={{ flex: i === current ? 2 : 1 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  />
                ))}
              </div>

              {/* Карточка слайда */}
              <AnimatePresence custom={direction} mode="wait">
                <motion.div
                  key={slide.id}
                  custom={direction}
                  initial={{ x: direction * 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -direction * 40, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  <div className="bg-white rounded-3xl border border-purple-100/80 shadow-sm overflow-hidden mb-4">
                    {/* Заголовок с градиентом */}
                    <div className="relative overflow-hidden px-7 py-6 bg-[linear-gradient(135deg,#ede9ff_0%,#f0ebff_50%,#f7f4ff_100%)]">
                      <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-primary/10 pointer-events-none" />
                      <div className="absolute right-10 bottom-0 w-14 h-14 rounded-full bg-primary/5 pointer-events-none" />
                      <div className="relative z-10 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/80 border border-primary/10 flex items-center justify-center text-3xl shadow-sm shrink-0">
                          {slide.icon ?? "📖"}
                        </div>
                        <div className="flex-1 min-w-0">
                          {slide.stepLabel && (
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/55 mb-1">{slide.stepLabel}</p>
                          )}
                          <h2 className="text-xl font-black text-text leading-tight">{slide.title}</h2>
                        </div>
                      </div>
                    </div>

                    {/* Тело */}
                    <div className="p-7 space-y-4">
                      <p className="text-text leading-relaxed text-[15px] whitespace-pre-line">{slide.content}</p>
                      {slide.highlight && <HighlightBlock text={slide.highlight} type={slide.highlightType} />}
                      {slide.tip && (
                        <div className="flex gap-3 bg-[linear-gradient(135deg,rgba(181,237,24,0.14),rgba(181,237,24,0.07))] border border-accent/25 rounded-2xl px-4 py-4">
                          <span className="text-xl shrink-0 mt-0.5">💡</span>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7aaa0a] mb-1">Запомни</p>
                            <p className="text-sm text-text leading-relaxed">{slide.tip}</p>
                          </div>
                        </div>
                      )}
                      {slide.imageUrl && (
                        <Image
                          src={slide.imageUrl}
                          alt=""
                          width={960}
                          height={384}
                          className="w-full rounded-2xl object-cover max-h-52"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      )}
                    </div>

                    {isLast && (
                      <div className="mx-6 mb-6 flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary-light border border-primary/15">
                        <span className="text-lg">⚡</span>
                        <p className="text-sm font-semibold text-primary">
                          Завершишь повторение — получишь +{XP_REWARDS.REVIEW_DONE} XP
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Навигация */}
              <div className="flex gap-3">
                <Button variant="secondary" size="md" onClick={goPrev} disabled={current === 0} className="w-28 shrink-0">
                  ← Назад
                </Button>
                <Button
                  variant={isLast ? "accent" : "primary"}
                  size="md"
                  onClick={goNext}
                  fullWidth
                >
                  {isLast ? `Завершить — +${XP_REWARDS.REVIEW_DONE} XP ⚡` : "Далее →"}
                </Button>
              </div>
            </div>

            {/* Боковая панель */}
            <div className="flex flex-col gap-4">

              {/* XP */}
              <div className="bg-[#1A1A2E] rounded-3xl p-5 relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-28 h-28 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10">
                  <p className="text-white/40 text-[11px] font-bold uppercase tracking-[0.18em] mb-2">Награда</p>
                  <div className="flex items-end gap-1.5">
                    <span className="text-4xl font-black text-accent leading-none">+{XP_REWARDS.REVIEW_DONE}</span>
                    <span className="text-white/40 text-lg font-bold mb-0.5">XP</span>
                  </div>
                  <p className="text-white/30 text-xs mt-1">После завершения повторения</p>
                </div>
              </div>

              {/* Список слайдов */}
              <div className="bg-white rounded-3xl border border-purple-100/80 shadow-sm p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-text-muted mb-4">Слайды урока</p>
                <div className="flex flex-col gap-1.5">
                  {lessonSlides.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => goToSlide(i)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
                        i === current ? "bg-primary-light border border-primary/20"
                        : i < current  ? "bg-success/6 hover:bg-success/10"
                        : "bg-gray-50 hover:bg-gray-100"
                      )}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0",
                        i === current ? "bg-primary text-white"
                        : i < current  ? "bg-success/20 text-success"
                        : "bg-gray-200 text-text-muted"
                      )}>
                        {i < current ? "✓" : i + 1}
                      </div>
                      <p className={cn(
                        "text-xs font-semibold truncate flex-1",
                        i === current ? "text-primary" : i < current ? "text-success" : "text-text-muted"
                      )}>
                        {s.title}
                      </p>
                      {i === current && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Прогресс урока — динамический */}
              {lesson && (
                <div className="bg-white rounded-3xl border border-purple-100/80 shadow-sm p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-text-muted mb-4">Прогресс урока</p>
                  <div className="flex flex-col gap-2">
                    {lesson.steps.map((step, i) => {
                      const isDone    = progress.steps[step.id]?.done ?? false;
                      const isCurrent = step.id === "review";
                      const unlocked  = isStepUnlocked(id, step.id);
                      return (
                        <button
                          key={step.id}
                          onClick={() => unlocked && router.push(`/lesson/${id}/${step.route}`)}
                          disabled={!unlocked}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all w-full",
                            isCurrent ? "bg-primary-light" : isDone ? "bg-success/6 hover:bg-success/10" : "bg-gray-50",
                            !unlocked && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <div className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0",
                            isDone ? "bg-success/15 text-success" : isCurrent ? "bg-primary text-white" : "bg-gray-200 text-text-muted"
                          )}>
                            {!unlocked ? "🔒" : isDone ? "✓" : i + 1}
                          </div>
                          <p className={cn(
                            "text-xs font-semibold flex-1",
                            isCurrent ? "text-primary font-bold" : isDone ? "text-success" : "text-text-muted"
                          )}>
                            {step.label}
                          </p>
                          {isCurrent && !isDone && <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">Сейчас</span>}
                          {isDone && !isCurrent && <span className="text-success text-xs">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
