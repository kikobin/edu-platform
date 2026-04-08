"use client";

import { useEffect } from "react";
import { SectionError } from "@/components/ui/SectionError";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin]", error);
  }, [error]);

  return (
    <SectionError
      title="Ошибка панели куратора"
      description="Попробуй обновить страницу."
      onReset={reset}
    />
  );
}
