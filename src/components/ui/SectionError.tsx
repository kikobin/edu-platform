"use client";

interface Props {
  title?: string;
  description?: string;
  /** If provided, shows "Try again" (soft reset) + "Reload" (hard reset). */
  onReset?: () => void;
}

export function SectionError({
  title = "Что-то пошло не так",
  description = "Попробуй перезагрузить страницу",
  onReset,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center">
      <span className="text-5xl mb-4">⚠️</span>
      <p className="font-bold text-text text-lg mb-1">{title}</p>
      <p className="text-text-muted text-sm mb-5">{description}</p>
      <div className="flex gap-3">
        {onReset && (
          <button
            onClick={onReset}
            className="px-5 py-2.5 bg-white text-primary border border-primary/30 rounded-xl font-semibold text-sm hover:bg-primary-light transition-colors"
          >
            Попробовать снова
          </button>
        )}
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          Перезагрузить
        </button>
      </div>
    </div>
  );
}
