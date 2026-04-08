import { vi, beforeEach } from "vitest";

// ── localStorage mock ─────────────────────────────────────────────────────────
// We can't rely on happy-dom/jsdom localStorage in vitest workers.
// Stub it with a plain in-memory implementation.
const _store: Record<string, string> = {};

const localStorageMock = {
  getItem:    (key: string)              => _store[key] ?? null,
  setItem:    (key: string, val: string) => { _store[key] = val; },
  removeItem: (key: string)              => { delete _store[key]; },
  clear:      ()                         => { for (const k in _store) delete _store[k]; },
  key:        (i: number)                => Object.keys(_store)[i] ?? null,
  get length()                           { return Object.keys(_store).length; },
};

vi.stubGlobal("localStorage", localStorageMock);

// Reset in-memory store before each test
beforeEach(() => {
  for (const k in _store) delete _store[k];
});

// ── fetch mock ────────────────────────────────────────────────────────────────
// Stores call fetch fire-and-forget for Supabase sync. Silence those calls.
global.fetch = vi.fn(() =>
  Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 })),
);

// ── requestIdleCallback shim ──────────────────────────────────────────────────
if (typeof globalThis.requestIdleCallback === "undefined") {
  // @ts-expect-error — browser API not in Node
  globalThis.requestIdleCallback = (cb: IdleRequestCallback) =>
    setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 }), 0);
}
