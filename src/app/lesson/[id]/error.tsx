"use client";

import { useEffect } from "react";
import { SectionError } from "@/components/ui/SectionError";

export default function LessonError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Lesson]", error);
  }, [error]);

  return (
    <SectionError
      title="Ошибка загрузки урока"
      description="Попробуй обновить страницу или вернись на главную."
      onReset={reset}
    />
  );
}
