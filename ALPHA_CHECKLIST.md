# Alpha Launch Checklist

## Auth & Security
- [x] Supabase JWT auth — cookies set by `@supabase/ssr`, no manual cookie management
- [x] `requireAuth()` on every API route — returns 401/403 on failure
- [x] Middleware validates JWT and routes by role (`student` / `curator` / `admin`)
- [x] Service role key (`SUPABASE_SERVICE_KEY`) never exposed to browser
- [x] RLS enabled on `profiles`, `xp_events`, `lesson_progress`, `submissions`
- [ ] Confirm `SUPABASE_SERVICE_KEY` is set in Vercel production env
- [ ] Confirm `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- [ ] Rotate Supabase anon key before public launch

## XP & Progress
- [x] XP awarded via `POST /api/xp/award` — idempotent at DB level (`UNIQUE(user_id, source_id)`)
- [x] `profiles.xp` kept in sync as denormalized cache for leaderboard
- [x] Homework approval awards +30 XP server-side
- [x] Client reconciles XP from server on every session start
- [x] Forward-only merge: server progress never rolls back local `done: true`

## Lessons
- [x] Review (slides) → `markReviewDone` → XP
- [x] Practice (quiz) → `markPracticeDone` → XP + bonus if score ≥ 80%
- [x] Video step → watch 80% → `markStepDone` → XP
- [x] Checkpoint step — quiz with min-pass score
- [x] Homework → checklist + link/text → submission API
- [x] Next lesson unlocks only after curator approves homework

## Homework & Curator Flow
- [x] Submissions upserted with versioning (resubmit increments version)
- [x] Curator sees only assigned students (curator-student filter)
- [x] Pagination on curator review queue (20 per page, load more)
- [x] Curator comment sent as in-app notification to student
- [x] Admin can approve/reject submissions from any student

## Leaderboard
- [x] Reads from `profiles` table (real XP, updated by `awardXP`)
- [x] Revalidates every 60 seconds (ISR)

## Profile & Shop
- [x] Avatar, title, frame changes synced to `profiles` DB
- [x] `useSession` reconciles profile on every app load

## Data Quality
- [x] Zod validation on: `POST /api/xp/award`, `POST /api/submissions`, `PATCH /api/admin/submissions/[id]`, `PATCH /api/profile`
- [x] Sentry `captureException` on all server error paths
- [x] Sentry `setUser` on session load, `setUser(null)` on logout

## Dead Code Removed
- [x] Old `edu_auth` / `edu_role` cookies — replaced by Supabase JWT
- [x] `src/lib/auth/localAdapter.ts`, `supabaseAdapter.ts`, `index.ts`, `types.ts` — deleted
- [x] `CREDENTIALS` from `data/users.ts` — removed from all API routes and admin pages
- [x] `POST /api/progress` for XP sync — replaced by `POST /api/xp/award`

## Before Go-Live
- [ ] Run `npm run build` — confirm 0 errors
- [ ] Smoke test login for each role (student, curator, admin)
- [ ] Verify leaderboard shows real data
- [ ] Verify XP popup fires on step completion
- [ ] Verify curator can approve homework and student receives notification
- [ ] Verify `profiles.xp` updates after approval (check Supabase dashboard)
- [ ] Set `SENTRY_DSN` in Vercel env
- [ ] Configure Sentry alerts for error spike
