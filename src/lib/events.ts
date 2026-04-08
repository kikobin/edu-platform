/**
 * Typed domain event bus for inter-feature communication.
 *
 * Features publish semantic events; subscribers react without knowing
 * who published. This keeps stores and components decoupled from
 * cross-cutting concerns like XP, achievements, and analytics.
 *
 * Usage:
 *   // Publish
 *   emit("lesson:step:completed", { lessonId: "l-1", stepId: "review", xpReward: 20 });
 *
 *   // Subscribe (e.g. in a hook or AppLayout useEffect)
 *   const off = on("lesson:step:completed", (e) => addXP(e.xpReward));
 *   return () => off(); // cleanup
 */

// ─── Event payloads ───────────────────────────────────────────────────────────

export interface LessonStepCompletedEvent {
  lessonId: string;
  stepId: string;
  xpReward: number;
  /** Score (0–100) for quiz / checkpoint steps; omitted for others */
  score?: number;
  /** true when practice/checkpoint score is ≥ 80 — triggers bonus XP */
  bonusEligible?: boolean;
}

export interface LessonCompletedEvent {
  lessonId: string;
}

// ─── Event map ────────────────────────────────────────────────────────────────

export interface DomainEventMap {
  "lesson:step:completed": LessonStepCompletedEvent;
  "lesson:completed":      LessonCompletedEvent;
}

export type DomainEventName = keyof DomainEventMap;

type Listener<K extends DomainEventName> = (payload: DomainEventMap[K]) => void;

// ─── Internal registry ────────────────────────────────────────────────────────

const registry = new Map<DomainEventName, Set<Listener<never>>>();

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Subscribe to a domain event.
 * Returns an unsubscribe function — call it in your cleanup (useEffect return).
 */
export function on<K extends DomainEventName>(
  event: K,
  listener: Listener<K>,
): () => void {
  if (!registry.has(event)) registry.set(event, new Set());
  registry.get(event)!.add(listener as Listener<never>);
  return () => registry.get(event)?.delete(listener as Listener<never>);
}

/**
 * Publish a domain event. All subscribers are called synchronously.
 */
export function emit<K extends DomainEventName>(
  event: K,
  payload: DomainEventMap[K],
): void {
  registry.get(event)?.forEach((fn) => {
    try {
      fn(payload as never);
    } catch (err) {
      // Subscriber errors must not crash the publisher
      console.error(`[events] subscriber error on "${event}":`, err);
    }
  });
}
