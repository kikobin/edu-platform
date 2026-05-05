import { notFound, redirect } from "next/navigation";
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
import { requireAuth } from "@/lib/auth/requireAuth";
import { isLessonUnlockedForUser } from "@/lib/unlock";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface Params { slug: string; n: string }

export function generateStaticParams() {
  return ALL_LESSONS.filter((l) => l.status === "available" && l.content).flatMap((l) =>
    l.content!.steps.map((step) => ({ slug: l.slug, n: String(step.n) }))
  );
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const lesson = getLessonBySlug(params.slug);
  const step = getLessonStep(params.slug, Number(params.n));
  if (!lesson || !step) return { title: "Шаг не найден" };
  return {
    title: `Шаг ${step.n}: ${step.title} · ${lesson.title}`,
    description: step.description,
  };
}

export default async function StudyStepPage({ params }: { params: Params }) {
  const lesson = getLessonBySlug(params.slug);
  const step = getLessonStep(params.slug, Number(params.n));
  if (!lesson || !lesson.content || !step) notFound();

  const auth = await requireAuth();
  if (auth instanceof NextResponse) redirect("/login");

  const unlocked = await isLessonUnlockedForUser(auth.appUserId, lesson.slug, auth.role);
  if (!unlocked) redirect(getLessonHref(lesson.slug));

  const totalSteps = getLessonTotalSteps(params.slug);
  const prevHref = step.n > 1 ? getLessonStepHref(params.slug, step.n - 1) : null;
  const nextHref = step.n < totalSteps ? getLessonStepHref(params.slug, step.n + 1) : null;
  const stepLabel = `Шаг ${step.n} из ${totalSteps}`;

  const allSteps = lesson.content.steps.map((s) => ({
    n: s.n,
    key: s.completion.type === "practice" ? s.completion.key : "submission",
    title: s.title,
    href: getLessonStepHref(lesson.slug, s.n),
  }));

  return (
    <AppLayout hideNav>
      <StepShellClient
        lessonSlug={lesson.slug}
        caption={step.caption}
        title={step.title}
        description={step.description}
        stepLabel={stepLabel}
        currentStepN={step.n}
        allSteps={allSteps}
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
