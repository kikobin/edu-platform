const PREFIX = "edu_";
const STORAGE_VERSION = 1;
const VERSION_KEY = PREFIX + "version";

// In-memory fallback когда localStorage недоступен (режим инкогнито, квота, Safari ITP)
const memoryFallback = new Map<string, string>();
let useMemory = false;

function isLocalStorageAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const testKey = "__edu_test__";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

// Определяем доступность один раз при загрузке
if (typeof window !== "undefined") {
  useMemory = !isLocalStorageAvailable();
}

function checkVersion() {
  if (useMemory) return; // В памяти версионирование не нужно
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem(VERSION_KEY);
    if (stored !== String(STORAGE_VERSION)) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(PREFIX)) keysToRemove.push(key);
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(VERSION_KEY, String(STORAGE_VERSION));
    }
  } catch {
    useMemory = true;
  }
}

checkVersion();

export const storage = {
  get<T>(key: string): T | null {
    if (typeof window === "undefined") return null;

    const fullKey = PREFIX + key;

    if (useMemory) {
      const raw = memoryFallback.get(fullKey);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        memoryFallback.delete(fullKey);
        return null;
      }
    }

    try {
      const raw = localStorage.getItem(fullKey);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      try { localStorage.removeItem(fullKey); } catch { /* ignore */ }
      return null;
    }
  },

  set<T>(key: string, value: T): boolean {
    if (typeof window === "undefined") return false;

    const fullKey = PREFIX + key;
    const serialized = JSON.stringify(value);

    if (useMemory) {
      memoryFallback.set(fullKey, serialized);
      return true;
    }

    try {
      localStorage.setItem(fullKey, serialized);
      return true;
    } catch {
      // Квота исчерпана — переключаемся на memory и пишем туда
      useMemory = true;
      memoryFallback.set(fullKey, serialized);
      window.dispatchEvent(new CustomEvent("edu:storage:error", { detail: { key } }));
      return true; // данные всё равно сохранены в памяти
    }
  },

  remove(key: string): void {
    if (typeof window === "undefined") return;

    const fullKey = PREFIX + key;

    if (useMemory) {
      memoryFallback.delete(fullKey);
      return;
    }

    try {
      localStorage.removeItem(fullKey);
    } catch { /* ignore */ }
  },

  /** Показывает, работаем ли в режиме памяти (без постоянного хранения) */
  isEphemeral(): boolean {
    return useMemory;
  },
};
