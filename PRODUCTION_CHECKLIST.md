# Production Readiness Checklist

Run this manually before each release. All items must pass.

---

## 1. Auth

- [ ] Login with student account (e.g. `danial` / `danial2024`) — redirected to `/dashboard`
- [ ] Login with wrong password — error message shown, no redirect
- [ ] Login with curator account (`curator` / `curator2024`) — redirected to `/admin`
- [ ] Login with admin account (`admin` / `admin2024`) — redirected to `/admin`
- [ ] After login, `edu_auth` cookie is set (check DevTools → Application → Cookies)
- [ ] After logout, cookie is cleared and `/dashboard` redirects to `/login`

---

## 2. Lesson flow

- [ ] First lesson (`lesson-codex-1`) is accessible from dashboard
- [ ] Second lesson (`lesson-netlify-5`) is **locked** until first lesson homework is approved
- [ ] Completing review marks the review step done (green checkmark on hub)
- [ ] Practice quiz: passing awards XP popup
- [ ] Homework submission sends to Supabase — verify row appears in `submissions` table
- [ ] Submitting homework shows "Ожидает проверки" amber banner (not green "Принято!")

---

## 3. XP

- [ ] Completing review awards 20 XP
- [ ] Completing practice awards 30 XP (+ 20 bonus if score ≥ 80%)
- [ ] Submitting homework awards 50 XP
- [ ] Navigating away and back to the same lesson does **not** award XP again
- [ ] XP bar on dashboard updates immediately after each step

---

## 4. Progress persistence

- [ ] Complete a step, reload the page — step shows as done
- [ ] Open the app in a new browser tab — progress is loaded from localStorage
- [ ] Clear localStorage, reload — progress is restored from Supabase (server reconciliation)
  - Verify: open DevTools → Application → Local Storage → delete all `edu_*` keys → reload
  - Expected: step statuses are restored within ~3 seconds (idle sync)

---

## 5. Curator approval flow

- [ ] Login as student, submit homework for lesson 1
- [ ] Login as curator, go to `/admin` → find the submission → approve it
- [ ] Login as student again — lesson 1 shows "Принято!" (green)
- [ ] Lesson 2 is now **unlocked** on the dashboard
- [ ] If curator sends to revision → student sees "На доработку" screen with comment

---

## 6. Leaderboard

- [ ] `/leaderboard` loads without error (even with no Supabase data)
- [ ] When Supabase returns data, real student names appear
- [ ] When Supabase is unreachable, fallback static data is shown (no error page)

---

## 7. Error logging

- [ ] If `NEXT_PUBLIC_SENTRY_DSN` is set: trigger a 500 error manually and verify event appears in Sentry
- [ ] If DSN is not set: no Sentry errors in console, platform works normally
- [ ] Error boundary pages (`/lesson/[id]/checkpoint`, `/profile`, `/admin`) render fallback UI on thrown errors

---

## 8. Content loading

- [ ] Review page loads slides for lesson 1 (`lesson-codex-1`)
- [ ] Practice page loads questions for lesson 1
- [ ] Homework page loads homework task for lesson 1
- [ ] No console errors about missing content

---

## 9. Environment variables

Verify all required vars are set before deploying:

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `SUPABASE_SERVICE_KEY` | Yes | Service role key (server-only) |
| `AUTH_ADAPTER` | Yes | `local` for dev, `supabase` for prod |
| `AUTH_CREDENTIALS_JSON` | Yes (if `local`) | JSON array of credentials |
| `NEXT_PUBLIC_APP_URL` | Yes | Full URL of the app |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Leave empty to disable Sentry |

---

## 10. Build

```bash
npx tsc --noEmit    # must exit 0
npm run build       # must exit 0
npm test            # all tests must pass
```
