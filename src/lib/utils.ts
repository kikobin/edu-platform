export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatXP(xp: number): string {
  return xp >= 1000 ? `${(xp / 1000).toFixed(1)}k` : String(xp);
}

/** Возвращает "1 апреля" или "—" при невалидной дате */
export function formatDeadline(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  } catch {
    return "—";
  }
}

/**
 * Сравниваем только даты (без времени), чтобы не зависеть от таймзоны.
 * Дедлайн считается просроченным если сегодня УЖЕ позже даты дедлайна.
 * То есть в сам день дедлайна ещё не просрочен.
 */
export function isDeadlinePassed(dateStr: string): boolean {
  try {
    const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
    return dateStr < today;
  } catch {
    return false;
  }
}

/** Ограничивает значение в диапазоне [0, 100] */
export function clamp100(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}
