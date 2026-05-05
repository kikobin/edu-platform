"use client";

import { useMemo } from "react";
import { useUserStore } from "@/store/userStore";
import { ModuleLessonCard } from "@/components/study/ModuleLessonCard";
import type { StudyLesson } from "@/types/study";

interface Props {
  lessons: StudyLesson[];
}

/**
 * Client wrapper that filters tier-tagged lessons by the current user's tier.
 * Lives in a client component because we need to read user.tier from the
 * Zustand store; the parent module page stays a server component for static
 * params + metadata.
 */
export function ModuleLessonsList({ lessons }: Props) {
  const userTier = useUserStore((s) => s.user?.tier);

  const visible = useMemo(() => {
    return lessons
      .filter((l) => !l.tier || l.tier === userTier)
      .sort((a, b) => a.id - b.id);
  }, [lessons, userTier]);

  return (
    <ol className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {visible.map((lesson, i) => (
        <li key={lesson.id}>
          <ModuleLessonCard lesson={lesson} index={i} />
        </li>
      ))}
    </ol>
  );
}
