"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeftIcon, ChevronRightIcon, LockIcon, CheckIcon } from "@/components/brand/Icon";
import { cn } from "@/lib/utils";
import { useStudyProgressStore } from "@/store/studyProgressStore";
import { useProgressStore } from "@/store/progressStore";
import { useUserStore } from "@/store/userStore";
import {
  areAllLessonStepsDone,
  findFirstIncompleteLessonStep,
  getLessonHref,
  getLessonStepHref,
  getLessonsByModule,
} from "@/content/study-lessons";
import type { StudyLesson } from "@/types/study";

interface Props {
  lesson: StudyLesson;
}

/**
 * Lesson landing — embeds the YouTube video, shows the recap + anchor list,
 * and a "start practice" CTA pointing at the first incomplete step.
 *
 * Renders only when lesson.content is present (other branches handled in the
 * page wrapper).
 */
export function LessonLanding({ lesson }: Props) {
  const content = lesson.content!; // page guarantees presence
  const { landing } = content;
  const totalSteps = content.steps.length;

  const hydrate = useStudyProgressStore((s) => s.hydrateLesson);
  useEffect(() => {
    void hydrate(lesson.slug);
  }, [hydrate, lesson.slug]);

  // Live snapshot of completed step keys for this lesson.
  const doneSet = useStudyProgressStore(
    (s) => s.byLesson[lesson.slug] ?? new Set<string>()
  );

  const progressSnapshot = useMemo(
    () => ({
      practiceSteps: doneSet,
      workSubmitted: doneSet.has("submission"),
    }),
    [doneSet]
  );

  const startN = findFirstIncompleteLessonStep(lesson.slug, progressSnapshot);
  const allDone = areAllLessonStepsDone(lesson.slug, progressSnapshot);
  const clampedStartN = Math.min(startN, totalSteps);
  const startHref = getLessonStepHref(lesson.slug, allDone ? 1 : clampedStartN);
  const startLabel = doneSet.size === 0
    ? "Начать с шага 1"
    : allDone
    ? "Перепройти с шага 1"
    : `Продолжить с шага ${clampedStartN}`;

  const userTier = useUserStore((s) => s.user?.tier);
  const moduleLessons = getLessonsByModule(lesson.module, userTier).sort((a, b) => a.id - b.id);
  const lessonNumberInModule = moduleLessons.findIndex((l) => l.id === lesson.id) + 1;
  const totalInModule = moduleLessons.length;
  const prevLesson = lessonNumberInModule > 1 ? moduleLessons[lessonNumberInModule - 2] : null;

  // Curator-approval gate: lesson 2+ unlocks only after the previous lesson's
  // submission has been approved. Lesson 1 in each module is always unlocked.
  const isUnlocked = useProgressStore((s) => s.isLessonUnlocked(lesson.slug));

  const [videoStart, setVideoStart] = useState<number | null>(null);
  const videoSrc = `https://www.youtube.com/embed/${landing.youtubeVideoId}?rel=0${
    videoStart != null ? `&start=${videoStart}&autoplay=1` : ""
  }`;

  const goToTimestamp = (seconds: number) => {
    setVideoStart(seconds);
    document.getElementById("video")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const meta = `${lesson.videoMinutes} мин видео · ${lesson.tools.join(" + ")} · ~${lesson.estimatedPracticeMinutes} мин практики`;
  const stepProgressPct = totalSteps > 0 ? Math.round((doneSet.size / totalSteps) * 100) : 0;

  // ── Locked screen ─────────────────────────────────────────────────────────
  if (!isUnlocked && prevLesson) {
    return (
      <div className="min-h-screen bg-bg">
        <div className="max-w-3xl mx-auto px-5 md:px-10 pt-6 pb-16">
          <Link
            href={`/modules/${lesson.module}`}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-text-muted hover:text-text transition-colors -ml-2 px-2 py-1.5 rounded-md hover:bg-white mb-8"
          >
            <ChevronLeftIcon size={14} />
            К списку уроков
          </Link>

          <div className="bg-white rounded-xl border border-border p-8 md:p-10 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-bg text-text-muted mb-4">
              <LockIcon size={22} />
            </div>
            <h1 className="text-[24px] md:text-[28px] font-semibold text-text mb-2 tracking-tight">
              Этот урок ещё закрыт
            </h1>
            <p className="text-text-muted text-[14px] leading-relaxed mb-6 max-w-md mx-auto">
              Сначала сдай работу за «{prevLesson.title}» и дождись одобрения куратора.
            </p>
            <Link
              href={getLessonHref(prevLesson.slug)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-[13px] font-semibold bg-primary text-white hover:bg-primary-hover transition-colors"
            >
              Перейти к предыдущему уроку
              <ChevronRightIcon size={14} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-5 md:px-10 pt-6 pb-16">
        <Link
          href={`/modules/${lesson.module}`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-text-muted hover:text-text transition-colors -ml-2 px-2 py-1.5 rounded-md hover:bg-white mb-8"
        >
          <ChevronLeftIcon size={14} />
          К списку уроков
        </Link>

        {/* Header */}
        <header className="mb-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary mb-3">
            Урок {lessonNumberInModule} из {totalInModule}
          </p>
          <h1 className="text-[28px] md:text-[36px] font-semibold text-text leading-[1.15] tracking-tight">
            {lesson.title}
          </h1>
          <p className="text-text-muted text-[15px] mt-3 max-w-[560px] leading-relaxed">
            {lesson.subtitle}
          </p>
          <p className="text-xs text-text-muted mt-3">{meta}</p>
        </header>

        {/* Video */}
        <section id="video" className="mb-10 scroll-mt-20">
          <div className="aspect-video rounded-xl overflow-hidden bg-dark border border-border">
            <iframe
              key={videoStart ?? "fresh"}
              src={videoSrc}
              title={`Видео: ${lesson.title}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full block"
            />
          </div>
        </section>

        {/* Recap + anchors */}
        <section className="mb-8 bg-white rounded-xl border border-border p-6 md:p-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted mb-3">
            Что мы разобрали в видео
          </p>
          <p className="text-[14px] text-text leading-relaxed mb-5">{landing.recap}</p>
          {landing.anchors.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {landing.anchors.map((a) => (
                <li key={a.time}>
                  <button
                    type="button"
                    onClick={() => goToTimestamp(a.seconds)}
                    className="text-left inline-flex items-center gap-3 text-[13px] text-primary hover:underline"
                  >
                    <span className="font-mono text-[11px] bg-primary/8 px-2 py-0.5 rounded">
                      {a.time}
                    </span>
                    <span className="text-text">{a.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Practice CTA — only when the lesson has steps. Placeholder lessons
            (ai-creator) ship with steps: [] until full content is authored. */}
        {totalSteps > 0 ? (
          <section className="mb-8 bg-white rounded-xl border border-border p-6 md:p-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="flex flex-col">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary mb-2">
                  Практика
                </p>
                <h2 className="text-[18px] font-semibold text-text">
                  {totalSteps} шагов внутри платформы
                </h2>
                <p className="text-text-muted text-[13px] mt-1 max-w-[460px] leading-relaxed">
                  Каждый шаг — отдельная страница. Кнопка «Дальше» открывается, когда закрываешь текущий шаг.
                </p>
                {doneSet.size > 0 && (
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-1.5 w-36 bg-bg rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        animate={{ width: `${stepProgressPct}%` }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-primary tabular-nums">
                      {doneSet.size}/{totalSteps}
                    </span>
                  </div>
                )}
              </div>
              <Link
                href={startHref}
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-[13px] font-semibold transition-colors shrink-0",
                  "bg-primary text-white hover:bg-primary-hover"
                )}
              >
                {startLabel}
                <ChevronRightIcon size={14} />
              </Link>
            </div>
          </section>
        ) : (
          <section className="mb-8 bg-white rounded-xl border border-border p-6 md:p-7">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary mb-2">
              Практика
            </p>
            <h2 className="text-[18px] font-semibold text-text">
              Скоро появятся интерактивные шаги
            </h2>
            <p className="text-text-muted text-[13px] mt-1 max-w-[460px] leading-relaxed">
              Пока что доступна видео-лекция выше. Когда появятся практические шаги, они откроются здесь.
            </p>
          </section>
        )}

        {/* Homework CTA — appears once all steps are done */}
        {allDone && lesson.homework && (
          <section className="mb-8 bg-white rounded-xl border border-border p-6 md:p-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary mb-2">
                  Финал
                </p>
                <h2 className="text-[18px] font-semibold text-text">
                  Сдай домашку, чтобы открыть следующий урок
                </h2>
                <p className="text-text-muted text-[13px] mt-1 max-w-[460px] leading-relaxed">
                  Три уровня глубины — выбери свой. После одобрения куратора следующий урок откроется.
                </p>
              </div>
              <Link
                href={`/study/${lesson.slug}/homework`}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-[13px] font-semibold transition-colors shrink-0 bg-primary text-white hover:bg-primary-hover"
              >
                К домашке
                <ChevronRightIcon size={14} />
              </Link>
            </div>
          </section>
        )}

        {/* Steps overview — hidden when there are no steps (placeholder lesson) */}
        {totalSteps > 0 && (
        <section className="mb-10 bg-white rounded-xl border border-border p-6 md:p-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted mb-4">
            Шаги урока
          </p>
          <ol className="flex flex-col gap-1.5">
            {content.steps.map((step) => {
              const key =
                step.completion.type === "practice" ? step.completion.key : "submission";
              const done = doneSet.has(key);
              return (
                <li key={step.n}>
                  <Link
                    href={getLessonStepHref(lesson.slug, step.n)}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-2.5 rounded-lg border transition-colors",
                      done
                        ? "bg-success/4 border-success/20 hover:bg-success/8"
                        : "bg-bg border-border hover:border-primary/30 hover:bg-white"
                    )}
                  >
                    <span
                      className={cn(
                        "w-6 h-6 rounded-md text-[11px] font-semibold flex items-center justify-center shrink-0",
                        done ? "bg-success text-white" : "bg-white border border-border text-text-muted"
                      )}
                    >
                      {done ? <CheckIcon size={14} /> : step.n}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-[13px] font-semibold leading-snug", done ? "text-success" : "text-text")}>
                        {step.title}
                      </p>
                      {step.description && (
                        <p className="text-[11px] text-text-muted mt-0.5 truncate">
                          {step.description}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
        )}
      </div>
    </div>
  );
}
