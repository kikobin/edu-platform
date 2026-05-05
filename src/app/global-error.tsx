"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="ru">
      <body className="min-h-screen bg-bg text-text">
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <span className="mb-4 text-5xl">⚠️</span>
          <p className="mb-1 text-lg font-bold">Критическая ошибка</p>
          <p className="mb-5 text-sm text-text-muted">
            Приложение столкнулось с ошибкой. Попробуй перезагрузить страницу.
          </p>
          <button
            onClick={() => reset()}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white"
          >
            Перезагрузить
          </button>
        </div>
      </body>
    </html>
  );
}
