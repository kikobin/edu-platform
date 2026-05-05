import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  ALL_LESSONS,
  getLessonBySlug,
  getLessonStep,
  getLessonStepHref,
  getLessonHref,
  getLessonTotalSteps,
} from "@/content/study-lessons";
import { StepShellClient } from "@/components/study/StepShellClient";
import { StepRouter } from "@/components/study/StepRouter";

interface Params { slug: string; n: string }

export function generateStaticParams() {
  return ALL_LESSONS.filter((l) => l.status === "available" && l.content).flatMap((l) =>
    l.content!.steps.map((step) => ({ slug: l.slug, n: String(step.n) }))
  );
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const lesson = getLessonBySlug(params.slug);
  const step = getLessonStep(params.slug, Number(params.n));
  if (!lesson || !step) return { title: "Шаг не найден" };
  return {
    title: `Шаг ${step.n}: ${step.title} · ${lesson.title}`,
    description: step.description,
  };
}

export default function StudyStepPage({ params }: { params: Params }) {
  const lesson = getLessonBySlug(params.slug);
  const step = getLessonStep(params.slug, Number(params.n));
  if (!lesson || !lesson.content || !step) notFound();

  const totalSteps = getLessonTotalSteps(params.slug);
  const prevHref = step.n > 1 ? getLessonStepHref(params.slug, step.n - 1) : null;
  const nextHref = step.n < totalSteps ? getLessonStepHref(params.slug, step.n + 1) : null;
  const stepLabel = `Шаг ${step.n} из ${totalSteps}`;

  return (
    <AppLayout hideNav>
      <StepShellClient
        lessonSlug={lesson.slug}
        caption={step.caption}
        title={step.title}
        description={step.description}
        stepLabel={stepLabel}
        totalSteps={totalSteps}
        backHref={getLessonHref(lesson.slug)}
        prevHref={prevHref}
        nextHref={nextHref}
        stepKey={step.completion.type === "practice" ? step.completion.key : "submission"}
      >
        <StepRouter
          lessonSlug={lesson.slug}
          lessonTitle={lesson.title}
          videoId={lesson.content.landing.youtubeVideoId}
          step={step}
        />
      </StepShellClient>
    </AppLayout>
  );
}
