"use client";

import { useEffect } from "react";
import { SectionError } from "@/components/ui/SectionError";

export default function CheckpointError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Checkpoint]", error);
  }, [error]);

  return (
    <SectionError
      title="Ошибка контрольной точки"
      description="Попробуй обновить страницу или вернись к уроку."
      onReset={reset}
    />
  );
}
