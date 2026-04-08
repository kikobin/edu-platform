"use client";

import { useEffect } from "react";
import { SectionError } from "@/components/ui/SectionError";

export default function ReviewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Review]", error);
  }, [error]);

  return (
    <SectionError
      title="Ошибка в повторении"
      description="Не удалось загрузить слайды. Попробуй ещё раз."
      onReset={reset}
    />
  );
}
