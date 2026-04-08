"use client";

import { useEffect } from "react";
import { SectionError } from "@/components/ui/SectionError";

export default function PracticeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Practice]", error);
  }, [error]);

  return (
    <SectionError
      title="Ошибка в закреплении"
      description="Не удалось загрузить вопросы. Попробуй ещё раз."
      onReset={reset}
    />
  );
}
