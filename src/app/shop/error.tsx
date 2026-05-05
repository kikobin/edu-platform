"use client";

import { useEffect } from "react";
import { SectionError } from "@/components/ui/SectionError";

export default function ShopError({
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
      title="Ошибка в магазине"
      description="Не удалось загрузить товары. Попробуй ещё раз."
      onReset={reset}
    />
  );
}
