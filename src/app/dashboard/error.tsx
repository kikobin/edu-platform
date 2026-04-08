"use client";

import { useEffect } from "react";
import { SectionError } from "@/components/ui/SectionError";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Dashboard]", error);
  }, [error]);

  return (
    <SectionError
      title="Ошибка загрузки дашборда"
      description="Попробуй обновить страницу."
      onReset={reset}
    />
  );
}
