"use client";

import { useEffect } from "react";
import { SectionError } from "@/components/ui/SectionError";

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Profile]", error);
    import("@sentry/nextjs").then((Sentry) => Sentry.captureException(error)).catch(() => {});
  }, [error]);

  return (
    <SectionError
      title="Ошибка загрузки профиля"
      description="Попробуй обновить страницу."
      onReset={reset}
    />
  );
}
