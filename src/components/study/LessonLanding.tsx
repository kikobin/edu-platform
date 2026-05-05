"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeftIcon, ChevronRightIcon, LockIcon, CheckIcon } from "@/components/brand/Icon";
import { cn } from "@/lib/utils";
import { FileDropzone } from "@/components/ui/FileDropzone";
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
import type { StudyLesson, StudyStep } from "@/types/study";

interface Props {
  lesson: StudyLesson;
}

interface UploadSubmissionStatus {
  status: "pending" | "approved" | "revision";
  curatorComment?: string;
}

export function LessonLanding({ lesson }: Props) {
  const content = lesson.content!;
  const { landing } = content;
  const totalSteps = content.steps.length;

  const hydrate = useStudyProgressStore((s) => s.hydrateLesson);
  useEffect(() => {
    void hydrate(lesson.slug);
  }, [hydrate, lesson.slug]);

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
  const startLabel =
    doneSet.size === 0
      ? "Начать с шага 1"
      : allDone
      ? "Перепройти с шага 1"
      : `Продолжить с шага ${clampedStartN}`;

  const userTier = useUserStore((s) => s.user?.tier);
  const moduleLessons = getLessonsByModule(lesson.module, userTier).sort(
    (a, b) => a.id - b.id
  );
  const lessonNumberInModule =
    moduleLessons.findIndex((l) => l.id === lesson.id) + 1;
  const totalInModule = moduleLessons.length;
  const prevLesson =
    lessonNumberInModule > 1 ? moduleLessons[lessonNumberInModule - 2] : null;

  const isUnlocked = useProgressStore((s) => s.isLessonUnlocked(lesson.slug));

  const [videoStart, setVideoStart] = useState<number | null>(null);
  const videoSrc = `https://www.youtube.com/embed/${landing.youtubeVideoId}?rel=0${
    videoStart != null ? `&start=${videoStart}&autoplay=1` : ""
  }`;

  const goToTimestamp = (seconds: number) => {
    setVideoStart(seconds);
    document
      .getElementById("video")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const meta = `${lesson.videoMinutes} мин видео · ${lesson.tools.join(" + ")} · ~${lesson.estimatedPracticeMinutes} мин практики`;
  const stepProgressPct =
    totalSteps > 0 ? Math.round((doneSet.size / totalSteps) * 100) : 0;

  // ── Locked screen ──────────────────────────────────────────────────────────
  if (!isUnlocked && prevLesson) {
    return (
      <div className="min-h-screen bg-bg">
        <div className="max-w-2xl mx-auto px-5 md:px-10 pt-6 pb-16">
          <Link
            href={`/modules/${lesson.module}`}
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-text-muted hover:text-text transition-colors -ml-2 px-2 py-1.5 rounded-md hover:bg-white mb-8"
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
              Сначала сдай работу за «{prevLesson.title}» и дождись одобрения
              куратора.
            </p>
            <Link
              href={getLessonHref(prevLesson.slug)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-[14px] font-semibold bg-primary text-white hover:bg-primary-hover transition-colors"
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
      <div className="max-w-[1240px] mx-auto px-5 md:px-10 lg:px-12 pt-6 pb-16">
        <Link
          href={`/modules/${lesson.module}`}
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-text-muted hover:text-text transition-colors -ml-2 px-2 py-1.5 rounded-md hover:bg-white mb-6"
        >
          <ChevronLeftIcon size={14} />
          К списку уроков
        </Link>

        {/* Desktop: two columns. Mobile: single column, title above video. */}
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
          {/* ── Left column: header + video + recap ─────────────────── */}
          <div className="min-w-0">
            <header className="mb-6 lg:mb-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary mb-3">
                Урок {lessonNumberInModule} из {totalInModule}
              </p>
              <h1 className="text-[28px] md:text-[34px] lg:text-[38px] font-semibold text-text leading-[1.1] tracking-tight">
                {lesson.title}
              </h1>
              <p className="text-text-muted text-[15px] md:text-[16px] mt-3 max-w-[640px] leading-relaxed">
                {lesson.subtitle}
              </p>
              <p className="text-[13px] text-text-muted mt-3">{meta}</p>
            </header>

            <section id="video" className="mb-8 scroll-mt-20">
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
              {lesson.module === "ai-creator" && lesson.homework && (
                <VideoFileUpload lesson={lesson} />
              )}
            </section>

            <section className="mb-8 bg-white rounded-xl border border-border p-6 md:p-7">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted mb-3">
                Что мы разобрали в видео
              </p>
              <p className="text-[15px] text-text leading-relaxed mb-5">
                {landing.recap}
              </p>
              {landing.anchors.length > 0 && (
                <ul className="flex flex-col gap-1.5">
                  {landing.anchors.map((a) => (
                    <li key={a.time}>
                      <button
                        type="button"
                        onClick={() => goToTimestamp(a.seconds)}
                        className="text-left inline-flex items-center gap-3 text-[14px] hover:underline"
                      >
                        <span className="font-mono text-[12px] bg-primary/8 text-primary px-2 py-0.5 rounded">
                          {a.time}
                        </span>
                        <span className="text-text">{a.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Mobile-only right-rail cards */}
            <div className="lg:hidden flex flex-col gap-4 mb-2">
              <PracticeCard
                totalSteps={totalSteps}
                doneCount={doneSet.size}
                stepProgressPct={stepProgressPct}
                startHref={startHref}
                startLabel={startLabel}
              />
              {allDone && lesson.homework && (
                <HomeworkCard slug={lesson.slug} />
              )}
              {totalSteps > 0 && (
                <StepsOverview
                  lessonSlug={lesson.slug}
                  steps={content.steps}
                  doneSet={doneSet}
                />
              )}
            </div>
          </div>

          {/* ── Right rail (desktop only) ────────────────────────────── */}
          <aside className="hidden lg:flex flex-col gap-4">
            <div className="sticky top-6 flex flex-col gap-4">
              {totalSteps > 0 ? (
                <PracticeCard
                  totalSteps={totalSteps}
                  doneCount={doneSet.size}
                  stepProgressPct={stepProgressPct}
                  startHref={startHref}
                  startLabel={startLabel}
                />
              ) : (
                <PracticePlaceholder />
              )}
              {allDone && lesson.homework && (
                <HomeworkCard slug={lesson.slug} />
              )}
              {totalSteps > 0 && (
                <StepsOverview
                  lessonSlug={lesson.slug}
                  steps={content.steps}
                  doneSet={doneSet}
                />
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function VideoFileUpload({ lesson }: { lesson: StudyLesson }) {
  const showToast = useUserStore((s) => s.showToast);
  const [file, setFile] = useState<File | null>(null);
  const [existing, setExisting] = useState<UploadSubmissionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch(`/api/submissions?lessonId=${encodeURIComponent(lesson.slug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!alive) return;
        setExisting(data ? {
          status: data.status,
          curatorComment: data.curatorComment,
        } : null);
      })
      .catch(() => {
        if (alive) setExisting(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [lesson.slug]);

  const canSubmit = Boolean(file) && !submitting;
  const lockedByReview = existing?.status === "pending" || existing?.status === "approved";

  const submit = async () => {
    if (!file || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const uploadRes = await fetch("/api/submissions/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
          lessonId: lesson.slug,
          homeworkId: `${lesson.slug}:homework`,
        }),
      });
      if (!uploadRes.ok) {
        const body = await uploadRes.json().catch(() => ({}));
        throw new Error(body.error ?? "Не удалось подготовить загрузку");
      }

      const { uploadUrl, fileUrl } = await uploadRes.json();
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("Не удалось загрузить файл");

      const submitRes = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: lesson.slug,
          homeworkId: `${lesson.slug}:homework`,
          lessonTitle: lesson.title,
          homeworkTitle: "Файл под видео",
          content: fileUrl,
          submitType: "file",
          fileUrl,
          fileMime: file.type,
          fileSize: file.size,
        }),
      });
      if (!submitRes.ok) {
        const body = await submitRes.json().catch(() => ({}));
        throw new Error(body.error ?? "Не удалось отправить файл куратору");
      }

      setExisting({ status: "pending" });
      setFile(null);
      showToast("Файл отправлен", "Куратор проверит работу и пришлёт ответ.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка отправки");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 rounded-xl border border-border bg-white p-5 md:p-6">
      <div className="mb-4 flex flex-col gap-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
          Файл к видео
        </p>
        <h2 className="text-[16px] font-semibold text-text leading-snug">
          Загрузи результат практики
        </h2>
        <p className="text-[13px] text-text-muted leading-relaxed">
          Подойдут изображение, видео или PDF до 50 МБ.
        </p>
      </div>

      {loading ? (
        <p className="text-[13px] text-text-muted">Проверяем прошлую сдачу...</p>
      ) : lockedByReview ? (
        <div
          className={cn(
            "rounded-lg border px-4 py-3 text-[13px] font-medium",
            existing.status === "approved"
              ? "border-success/20 bg-success/8 text-success"
              : "border-amber-200 bg-amber-50 text-amber-700"
          )}
        >
          {existing.status === "approved"
            ? "Файл принят куратором."
            : "Файл отправлен и ждёт проверки."}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {existing?.status === "revision" && (
            <div className="rounded-lg border border-error/20 bg-error-light px-4 py-3 text-[13px] text-error">
              <p className="font-semibold">Нужна доработка</p>
              {existing.curatorComment && (
                <p className="mt-1 leading-relaxed">{existing.curatorComment}</p>
              )}
            </div>
          )}
          <FileDropzone
            onFileReady={setFile}
            maxSizeMB={50}
            label="Выбери файл или перетащи сюда"
          />
          {error && (
            <p className="rounded-lg border border-error/20 bg-error-light px-4 py-3 text-[13px] font-medium text-error">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Загружаем..." : "Отправить файл куратору"}
          </button>
        </div>
      )}
    </div>
  );
}

function PracticeCard({
  totalSteps,
  doneCount,
  stepProgressPct,
  startHref,
  startLabel,
}: {
  totalSteps: number;
  doneCount: number;
  stepProgressPct: number;
  startHref: string;
  startLabel: string;
}) {
  return (
    <section className="bg-white rounded-xl border border-border p-5 md:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary mb-2">
        Практика
      </p>
      <h2 className="text-[17px] font-semibold text-text leading-snug">
        {totalSteps} шагов внутри платформы
      </h2>
      <p className="text-text-muted text-[13px] mt-1.5 leading-relaxed">
        Каждый шаг — отдельная страница. «Дальше» открывается после прохождения.
      </p>
      {doneCount > 0 && (
        <div className="mt-4 flex items-center gap-3">
          <div className="h-1.5 flex-1 bg-bg rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${stepProgressPct}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          <span className="text-[12px] font-semibold text-primary tabular-nums">
            {doneCount}/{totalSteps}
          </span>
        </div>
      )}
      <Link
        href={startHref}
        className="mt-5 w-full inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-[14px] font-semibold transition-colors bg-primary text-white hover:bg-primary-hover"
      >
        {startLabel}
        <ChevronRightIcon size={14} />
      </Link>
    </section>
  );
}

function PracticePlaceholder() {
  return (
    <section className="bg-white rounded-xl border border-border p-5 md:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary mb-2">
        Практика
      </p>
      <h2 className="text-[16px] font-semibold text-text leading-snug">
        Скоро появятся интерактивные шаги
      </h2>
      <p className="text-text-muted text-[13px] mt-1.5 leading-relaxed">
        Пока что доступна видео-лекция выше. Когда появятся шаги, они откроются здесь.
      </p>
    </section>
  );
}

function HomeworkCard({ slug }: { slug: string }) {
  return (
    <section className="bg-white rounded-xl border border-border p-5 md:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary mb-2">
        Финал
      </p>
      <h2 className="text-[16px] font-semibold text-text leading-snug">
        Сдай домашку, чтобы открыть следующий урок
      </h2>
      <p className="text-text-muted text-[13px] mt-1.5 leading-relaxed">
        Три уровня глубины — выбери свой. После одобрения куратора следующий урок откроется.
      </p>
      <Link
        href={`/study/${slug}/homework`}
        className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg text-[14px] font-semibold transition-colors bg-primary text-white hover:bg-primary-hover"
      >
        К домашке
        <ChevronRightIcon size={14} />
      </Link>
    </section>
  );
}

function StepsOverview({
  lessonSlug,
  steps,
  doneSet,
}: {
  lessonSlug: string;
  steps: StudyStep[];
  doneSet: Set<string>;
}) {
  return (
    <section className="bg-white rounded-xl border border-border p-5 md:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted mb-3">
        Шаги урока
      </p>
      <ol className="flex flex-col gap-1">
        {steps.map((step) => {
          const key =
            step.completion.type === "practice"
              ? step.completion.key
              : "submission";
          const done = doneSet.has(key);
          return (
            <li key={step.n}>
              <Link
                href={getLessonStepHref(lessonSlug, step.n)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors",
                  done
                    ? "bg-success/5 border-success/20 hover:bg-success/10"
                    : "bg-bg border-border hover:border-primary/30 hover:bg-white"
                )}
              >
                <span
                  className={cn(
                    "w-6 h-6 rounded-md text-[11px] font-semibold flex items-center justify-center shrink-0",
                    done
                      ? "bg-success text-white"
                      : "bg-white border border-border text-text-muted"
                  )}
                >
                  {done ? <CheckIcon size={14} /> : step.n}
                </span>
                <p className="text-[13px] font-medium leading-snug min-w-0 break-words text-text">
                  {step.title}
                </p>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
