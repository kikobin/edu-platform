/**
 * Sentry — client-side initialization.
 *
 * Required env vars (set in Vercel Dashboard or .env.local):
 *   NEXT_PUBLIC_SENTRY_DSN  — from Sentry → Project Settings → Client Keys
 *
 * Optional (only needed for source map uploads at build time):
 *   SENTRY_ORG, SENTRY_PROJECT, SENTRY_AUTH_TOKEN
 */
import * as Sentry from "@sentry/nextjs";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    enabled: process.env.NODE_ENV === "production",

    // 10% of page-loads traced for performance monitoring
    tracesSampleRate: 0.1,

    // 100% of sessions that throw errors get a replay attached
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.01,

    // Filter out browser noise that doesn't represent real bugs
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      "Non-Error promise rejection captured",
      /^Loading chunk \d+ failed/,
    ],

    beforeSend(event) {
      // Remove personally identifiable fields — keep only user.id for grouping
      if (event.user) {
        event.user = { id: event.user.id };
      }
      return event;
    },
  });
}
