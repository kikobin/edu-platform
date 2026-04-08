# Manual Actions Required

These items cannot be completed via code or migration — they require direct action
in the Supabase Dashboard or another external service.

---

## 1. Rotate all 7 user passwords  **CRITICAL — do before production launch**

The old plaintext passwords were deleted from source code, but the passwords themselves
still exist in Supabase Auth.

**How:**
Dashboard → Authentication → Users → click each user → Edit User → set a new password.

Do NOT use "Send password reset" — the fabricated `@edu-platform.internal` emails are
unreachable. Set the password directly in the UI.

After changing each password, invalidate existing sessions:

```sql
-- Run in SQL Editor for each user UUID (replace the id)
DELETE FROM auth.sessions WHERE user_id = '<user-uuid>';
```

**Users to rotate:**
`student-1` through `student-5`, `curator-1`, `admin-1`
(look up their auth UUIDs via Dashboard → Auth → Users)

---

## 2. Enable leaked password protection  **RECOMMENDED**

Supabase cannot enable this via SQL migration (`auth.config` table does not exist).

**How:**
Dashboard → Authentication → Settings → "Leaked Password Protection" → Enable → Save.

This uses the HaveIBeenPwned API to reject passwords found in known breach databases.

---

## 3. Confirm Row-Level Security is ON for all tables  **Verify after any schema change**

All 8 tables should have RLS enabled. Verify via:

Dashboard → Table Editor → select table → RLS tab, or:

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Expected: `rowsecurity = true` for all tables.

---

## 4. Confirm email confirmations are OFF  **Required for username-based auth**

This project uses fabricated `@edu-platform.internal` emails, so confirmation emails
must be disabled.

**How:**
Dashboard → Authentication → Settings → Email → uncheck "Confirm email" → Save.

---

## 5. Set allowed redirect URLs (when adding a custom domain)

If the app is deployed to a custom domain (not just Vercel preview):

Dashboard → Authentication → URL Configuration → add the production URL to
"Redirect URLs" and update "Site URL".

---

## 6. Check git history for leaked secrets

Before making the repository public, verify no secrets were ever committed:

```bash
git log --all --oneline -- .env.local
git log --all -p -- .env.local | grep -E "KEY=|PASSWORD=|SECRET="
```

If any real keys appear in history, rotate them immediately via Supabase Dashboard →
Settings → API → Regenerate keys.

---

## 7. Apply pending SQL migrations  **REQUIRED for stability**

The following migrations must be applied in Supabase SQL Editor in order:

### 002_monotonic_lesson_progress_upsert.sql  **REQUIRED**

`/api/progress/lesson` now uses `upsert_lesson_progress_monotonic()` RPC.
**Without this migration the route returns 500 for every lesson progress save.**

**How:** Copy the contents of `docs/migrations/002_monotonic_lesson_progress_upsert.sql`
and run it in Supabase → SQL Editor.

---

## Checklist before production launch

- [ ] All 7 passwords rotated (item 1)
- [ ] Leaked password protection enabled (item 2)
- [ ] RLS verified on all tables (item 3)
- [ ] Email confirmation disabled (item 4)
- [ ] Git history checked for secrets (item 6)
- [ ] Migration 002 applied (item 7)
- [ ] Sentry DSN configured in Vercel environment variables
- [ ] `NEXT_PUBLIC_APP_URL` set to production URL in Vercel
