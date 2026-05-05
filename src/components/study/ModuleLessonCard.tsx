"use client";

import Link from "next/link";
import { useProgressStore } from "@/store/progressStore";
import { getLessonHref } from "@/content/study-lessons";
import { CheckIcon, LockIcon, ClockIcon } from "@/components/brand/Icon";
import { cn } from "@/lib/utils";
import type { StudyLesson } from "@/types/study";

interface Props {
  lesson: StudyLesson;
  index: number;
}

export function ModuleLessonCard({ lesson, index }: Props) {
  const isUnlocked  = useProgressStore((s) => s.isLessonUnlocked(lesson.slug));
  const isCompleted = useProgressStore((s) => s.isLessonCompleted(lesson.slug));
  const lp          = useProgressStore((s) => s.getLesson(lesson.slug));
  const awaitingApproval = lp.homeworkStatus === "submitted";

  const accent =
    isCompleted     ? "border-success/30 hover:border-success/50" :
    !isUnlocked     ? "border-border opacity-60 cursor-not-allowed" :
    awaitingApproval ? "border-amber-200 hover:border-amber-300" :
    "border-border hover:border-primary/30";

  const status =
    isCompleted     ? { icon: <CheckIcon size={12} />, label: "Завершён", color: "text-success" } :
    !isUnlocked     ? { icon: <LockIcon size={12} />, label: "Закрыт",   color: "text-text-muted" } :
    awaitingApproval ? { icon: <ClockIcon size={12} />, label: "На проверке", color: "text-amber-700" } :
    null;

  return (
    <Link
      href={isUnlocked ? getLessonHref(lesson.slug) : "#"}
      onClick={(e) => !isUnlocked && e.preventDefault()}
      className={cn(
        "block bg-white rounded-xl border p-5 md:p-6 transition-colors",
        accent
      )}
    >
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
          Урок {index + 1}
        </p>
        {status && (
          <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider", status.color)}>
            {status.icon}
            {status.label}
          </span>
        )}
      </div>
      <h2 className="text-[15px] md:text-[16px] font-semibold text-text leading-snug">
        {lesson.title}
      </h2>
      <p className="text-[13px] text-text-muted mt-2 leading-relaxed line-clamp-2">
        {lesson.subtitle}
      </p>
      <p className="text-[11px] text-text-muted mt-3">
        {lesson.videoMinutes} мин видео · {lesson.tools.join(", ")}
      </p>
    </Link>
  );
}
