import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { ALL_LESSONS, getLessonBySlug } from "@/content/study-lessons";
import { LessonLanding } from "@/components/study/LessonLanding";

interface Params { slug: string }

export function generateStaticParams() {
  return ALL_LESSONS.filter((l) => l.status === "available").map((l) => ({ slug: l.slug }));
}

export function generateMetadata({ params }: { params: Params }): Metadata {
  const lesson = getLessonBySlug(params.slug);
  if (!lesson) return { title: "Урок не найден" };
  return { title: `${lesson.title} · edu-platform`, description: lesson.subtitle };
}

export default function StudyLessonPage({ params }: { params: Params }) {
  const lesson = getLessonBySlug(params.slug);
  if (!lesson || lesson.status !== "available" || !lesson.content) notFound();

  return (
    <AppLayout hideNav>
      <LessonLanding lesson={lesson} />
    </AppLayout>
  );
}
