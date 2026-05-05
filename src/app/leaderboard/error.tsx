"use client";

import { useEffect } from "react";
import { SectionError } from "@/components/ui/SectionError";

export default function LeaderboardError({
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
      title="Ошибка загрузки рейтинга"
      description="Попробуй обновить страницу."
      onReset={reset}
    />
  );
}
