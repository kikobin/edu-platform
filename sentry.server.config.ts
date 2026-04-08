/**
 * Sentry — server-side initialization (Node.js / Edge runtime).
 * Called for API routes, middleware, and server components.
 *
 * Required env var: NEXT_PUBLIC_SENTRY_DSN
 */
import * as Sentry from "@sentry/nextjs";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    enabled: process.env.NODE_ENV === "production",

    // Lower sample rate on server — mostly care about errors, not traces
    tracesSampleRate: 0.05,

    beforeSend(event) {
      if (event.user) {
        event.user = { id: event.user.id };
      }
      return event;
    },
  });
}
