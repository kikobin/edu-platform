# Manual QA / Stability Audit Report

This report summarizes the findings from navigating the live local application (`http://localhost:3000`) as three different personas (Unauthenticated, Student: `danial`, Curator: `curator`).

## Findings

### A. Title: Internal Server Error on Lesson Progress Update
**B. Severity:** critical
**C. Where it is:** `http://localhost:3000/api/progress/lesson` (triggered from Lesson UI flow)
**D. Steps to reproduce:**
1. Login as Student (`danial` / `danial2024`).
2. Go to a lesson step (e.g. *Повторение*).
3. Proceed through instructions and click "Далее" or "Завершить повторение" at the end of the step.
4. Monitor the browser DevTools (Network / Console).
**E. What actually happens:** The UI successfully shows an optimistic success message (like "Видео засчитано!"), but the background POST request to `/api/progress/lesson` consistently returns a `500 Internal Server Error`.
**F. What should happen:** The backend API should return a `200/201` success status, and progress must be safely recorded in the database.
**G. Why it is risky:** This is a silent failure. The user operates under a false sense of success because the UI masks the critical database error.
**H. What can break in real usage:** If a student completes multiple lessons and then hits refresh or logs in on another device, all their newly acquired progress will vanish, forcing them to retake the content and causing extreme frustration.
**I. Evidence:** Console errors observed during lesson flow: `[error] Failed to load resource: the server responded with a status of 500 (Internal Server Error)` on `http://localhost:3000/api/progress/lesson`.
**J. Recommended fix direction:** Inspect the backend route `/api/progress/lesson` for unhandled runtime exceptions or database constraint failures (e.g., missing payload formats or duplicate unique keys). Ensure the UI correctly awaits the network response and warns the user if it fails instead of using a fully optimistic update.
**K. Priority order:** 1

---

### A. Title: Blank Profile Page (Complete Rendering Failure)
**B. Severity:** high
**C. Where it is:** `http://localhost:3000/profile`
**D. Steps to reproduce:**
1. Login as Student (`danial` / `danial2024`).
2. Navigate to "Профиль" via the left sidebar or directly hitting the URL.
**E. What actually happens:** The page renders completely blank (a white screen with no layout). A hard refresh does not resolve the issue.
**F. What should happen:** The profile page should load safely, fetching the user's data and rendering their statistics and personal info alongside the general layout.
**G. Why it is risky:** A core navigation link is dead, leaving the user trapped on an empty screen.
**H. What can break in real usage:** Users have zero access to their settings or gamification elements tied to their profile, degrading the overall platform experience.
**I. Evidence:** Empty `<body>` dom capture and blank layout upon reaching `/profile` during navigation.
**J. Recommended fix direction:** Investigate the `/profile` page component for a client-side execution crash. Usually, this is caused by a missing optional chain (`?.`) when accessing a potentially null object (e.g., trying to read `user.achievements.length` before `achievements` exists).
**K. Priority order:** 2

---

### A. Title: Non-Idempotent XP Awards on Homework Status Reset
**B. Severity:** medium
**C. Where it is:** Curator Dashboard -> `/admin/homework` and `/admin/students`
**D. Steps to reproduce:**
1. Login as Curator (`curator` / `curator2024`).
2. Go to "Домашние задания" and click "Принять" (Accept) for any student (e.g., Дильназ).
3. Check the "Ученики" list – observe the student's XP increase (e.g. from 135 to 165 XP).
4. Go back to the homework tab and click "Сбросить статус" (Reset status) on that same submission.
5. Check XP in the "Ученики" list once more.
**E. What actually happens:** The student's XP remains at 165. The awarded points are never deducted even though the homework is no longer "accepted".
**F. What should happen:** Changing a homework's status from 'Accepted' to any non-accepted status (like 'Waiting' or 'Rejected') should rollback/deduct the previously awarded XP.
**G. Why it is risky:** It breaks the gamification economy. It opens up an "XP inflation" bug where students get points for unapproved work.
**H. What can break in real usage:** Curators misclicking "Accept" and instantly reverting it will permanently inflate the student's balance. Malicious play could involve getting work conditionally accepted, rejected, and yet keeping the reward.
**I. Evidence:** Observed student XP holding steady at an inflated value after a curator reversed an acceptance.
**J. Recommended fix direction:** Attach the XP transaction strictly to the status delta. If transitioning away from an accepted state, fire a negative XP transaction to re-balance the ledger.
**K. Priority order:** 3

---

## Overall Assessment

### 1. Stability Score (1 to 10)
- **auth/session:** `8` (Login and logout flows are solid. There are minor, transparent 401s in console during initial mount that auto-resolve).
- **route protection:** `10` (Directly navigating to `/admin` without admin rights or unauthenticated firmly bounces to `/login`).
- **lesson flow:** `7` (Highly responsive UI handling double-clicks well, but the critical 500 error on saving state drops the score).
- **homework submission:** `9` (Structurally sound and flows seamlessly on the student side).
- **admin workflow:** `6` (Slow list population for the first time and flawed state propagation—like the XP glitch).
- **profile/shop consistency:** `1` (The `/profile` is fully broken and inaccessible).
- **loading/error resilience:** `5` (Heavy reliance on optimistic UI logic masks severe errors like the lesson 500s from the user).
- **overall browser stability:** `6`

### 2. Top 5 Most Dangerous Live Issues
1. **Silent 500 Error on Lesson Progress:** Prevents data from saving while telling the user everything is fine.
2. **Blank Profile Screen:** Dead end in main navigation.
3. **XP Inflation via Homework Reversals:** Curator actions don't rollback gamification currency.
4. **Optimistic "False Success" States:** Across the board, toasts indicate success based on button clicks rather than successful backend commitments.
5. **Slow Data Population in Admin Tables:** Empty table states flash dangerously before populating, risking double-action or confusion.

### 3. Most Suspicious Areas (Needing Immediate Code Inspection)
- **POST `/api/progress/lesson` Handler:** Needs urgent investigation for missing validation or broken database constraints that trigger unhandled 500s.
- **`<ProfilePage>` React Component:** Needs a trace for runtime errors crashing the component tree.
- **Homework Status Mutation Services:** Missing rollback transaction code when handling the "Reset Status" action.

### 4. What Currently Looks Stable
- **Authentication Resilience:** Cookies properly hold session; sign-out wipes state efficiently.
- **Strict Role Scoping:** Curator layouts are completely shielded from standard students; the middleware boundary is intact.
- **UI Debouncing in Lessons:** Clicking "Далее/Submit" rapidly multiple times or double-clicking does NOT send redundant state update fires in the UI, proving good debouncing at the component layer.
