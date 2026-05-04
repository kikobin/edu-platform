# Production Readiness Checklist

Run this manually before each release. All items must pass.

---

## 1. Auth

- [ ] Student login lands on `/dashboard`. Wrong password → error, no redirect.
- [ ] Curator login lands on `/admin` (or `/dashboard` if curator role missing).
- [ ] Admin login lands on `/admin`.
- [ ] After login, Supabase `sb-*` cookies are set (DevTools → Application → Cookies). No legacy `edu_auth` cookie should exist.
- [ ] Logout clears cookies; `/dashboard`, `/profile`, `/admin` all redirect to `/login`.
- [ ] `/api/auth/login` returns 429 after >20 attempts/min from one IP, or >10 attempts/min for one username.

---

## 2. Lesson flow

- [ ] First lesson is accessible from the dashboard for a fresh student.
- [ ] Subsequent lessons stay **locked** until the previous lesson's homework is approved.
- [ ] Review step → completion marks the step done; XP popup appears once.
- [ ] Practice quiz → passing awards XP; failing does not.
- [ ] Homework submission persists: a row appears in `public.submissions` with correct `user_id` / `lesson_id`.
- [ ] Submitted homework shows "Ожидает проверки" (amber), not "Принято".

---

## 3. XP

- [ ] Each step awards its expected amount (review 20, practice 30 + 20 bonus, homework submit 50, homework approved 30).
- [ ] Re-entering a completed step does **not** double-award (`xp_events` UNIQUE on `user_id, source_id`).
- [ ] Curator approve → XP increases by 30. Curator resets status away from "approved" → XP rolls back by 30.
- [ ] Admin XP adjustment endpoint enforces `delta > 0`, integer, ≤ 10 000, rate-limited 30/min.

---

## 4. Progress persistence

- [ ] Complete a step → reload → step still done (read from `lesson_progress` via `/api/progress`).
- [ ] Open in a second tab → progress loads from local store immediately, server reconciliation fills any gaps.
- [ ] Clear localStorage → reload → progress restored from server within ~3s (idle sync).

---

## 5. Curator approval

- [ ] Curator can only act on their own students (filtered through `groups`).
- [ ] Cross-curator submission access returns 403.
- [ ] Approve → student sees "Принято" + next lesson unlocks.
- [ ] Send to revision → student sees revision screen + curator comment.

---

## 6. Leaderboard

- [ ] `/leaderboard` renders successfully even with empty data.
- [ ] Real names appear once `profiles` has rows; the current user is highlighted.

---

## 7. Error logging

- [ ] With `NEXT_PUBLIC_SENTRY_DSN` set: forced 500 produces an event in Sentry within ~1 min.
- [ ] Sentry events carry `user.id` for logged-in sessions and clear it on logout.
- [ ] Error boundaries (`/profile`, `/lesson/[id]/checkpoint`, `/admin`) render fallback UI instead of blank screens.
- [ ] `/profile` never renders an empty `<body>` — the visible spinner is shown until the user store hydrates.

---

## 8. Content loading

- [ ] Review, practice, homework pages all load their content for at least one lesson per course module.
- [ ] No console errors about missing slides/questions/homework.

---

## 9. Database hardening

- [ ] `npx supabase` advisors clean except for `auth_leaked_password_protection` (Pro-plan feature).
- [ ] `anon` and `authenticated` roles have no `SELECT/INSERT/UPDATE/DELETE` grants on any public table — server-side service-role is the only writer.
- [ ] `public.upsert_lesson_progress_monotonic` function: `EXECUTE` revoked from `anon`/`authenticated`/`public`.
- [ ] RLS enabled on all 8 public tables (`profiles`, `xp_events`, `purchases`, `submissions`, `lesson_progress`, `notifications`, `groups`, `user_progress`).

---

## 10. Frontend hardening

- [ ] `vercel.json` CSP active and does **not** include `unsafe-eval` (only `unsafe-inline` for scripts during Next bootstrap).
- [ ] `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'` headers present.
- [ ] `src/lib/supabase.ts` has `import "server-only"` so service-key cannot leak into the client bundle.
- [ ] `/admin/layout.tsx` is a server component that calls `supabase.auth.getUser()` and redirects non-admin/curator before any admin page renders.

---

## 11. Environment variables

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key |
| `SUPABASE_SERVICE_KEY` | Yes | Service role key — **server-only**, never exposed to the client |
| `NEXT_PUBLIC_APP_URL` | Yes | Full URL of the app |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Leave empty to disable client Sentry |
| `SENTRY_AUTH_TOKEN` | No | Required only when uploading sourcemaps at deploy time |

Legacy variables (`AUTH_ADAPTER`, `AUTH_CREDENTIALS_JSON`, `edu_auth` cookie) have been removed — Supabase Auth is the sole auth source.

---

## 12. Build & tests

```bash
npx tsc --noEmit    # must exit 0
npm run build       # must exit 0
npm test            # all tests must pass
```

Sentry's OpenTelemetry "require function" warning during build is benign and can be ignored.

---

## 13. Pre-launch (one-time)

- [ ] Rotate any seed passwords in Supabase Auth UI before letting real users in (none have known plaintext after the seed scrub).
- [ ] On a Pro plan: enable Leaked Password Protection (HaveIBeenPwned) in Auth → Policies.
- [ ] Set `SENTRY_DSN` and Vercel project env vars; confirm a test event arrives.
- [ ] Apply pending migrations in `docs/migrations/` to the live project (the MCP `list_migrations` should match).
