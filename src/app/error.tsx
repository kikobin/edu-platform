"use client";

import { useEffect } from "react";
import { SectionError } from "@/components/ui/SectionError";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    import("@sentry/nextjs").then((Sentry) => Sentry.captureException(error)).catch(() => {});
  }, [error]);

  return (
    <SectionError
      title="Ошибка приложения"
      description="Не удалось загрузить страницу. Попробуй ещё раз."
      onReset={reset}
    />
  );
}
