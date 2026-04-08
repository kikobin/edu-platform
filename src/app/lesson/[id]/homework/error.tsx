"use client";

import { useEffect } from "react";
import { SectionError } from "@/components/ui/SectionError";

export default function HomeworkError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Homework]", error);
  }, [error]);

  return (
    <SectionError
      title="Ошибка в домашнем задании"
      description="Не удалось загрузить задание. Попробуй ещё раз."
      onReset={reset}
    />
  );
}
