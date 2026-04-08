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
    console.error("[Leaderboard]", error);
  }, [error]);

  return (
    <SectionError
      title="Ошибка загрузки рейтинга"
      description="Попробуй обновить страницу."
      onReset={reset}
    />
  );
}
