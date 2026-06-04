# Adaptive English Learning Platform

## What this project is

An AI-assisted adaptive English learning platform for students, teachers, and admins. Built as a Next.js full-stack app with Supabase as the backend. The thesis project title: **«Адаптивное тестовое приложение обучающего курса английского языка на основе искусственного интеллекта»**.

## Roles

- **Student** — takes lessons, submits homework, earns XP, sees leaderboard
- **Teacher/Curator** — reviews homework, tracks student progress, manages groups
- **Admin** — manages users, groups, content

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| UI | React 18 + Tailwind CSS |
| Language | TypeScript |
| Database + Auth | Supabase (PostgreSQL + Supabase Auth) |
| Validation | Zod |
| State (client) | Zustand |
| Testing | Vitest |
| Error tracking | Sentry (`sentry.client.config.ts`, `sentry.server.config.ts`) |
| File storage | AWS S3 SDK / Cloudflare R2 |
| Deployment | Vercel (`vercel.json`) |

## Project structure

```
src/
  app/
    layout.tsx / page.tsx    — root layout and home
    login/                   — auth pages
    dashboard/               — student dashboard
    modules/                 — lesson modules
    study/                   — study session
    my-homework/             — student homework view
    leaderboard/             — XP leaderboard
    shop/                    — reward shop
    profile/                 — user profile
    admin/                   — admin panel
    api/                     — API route handlers
      auth/login/            — login endpoint
      profile/               — profile CRUD
  lib/
    validation/              — Zod schemas
scripts/                     — utility/migration scripts
docs/                        — project documentation
reports/                     — QA and audit reports
```

## Key files

- `ALPHA_CHECKLIST.md` — pre-alpha release checklist
- `PRODUCTION_CHECKLIST.md` — production readiness checklist
- `qa_audit_report.md` — QA audit findings
- `next.config.mjs` — Next.js config
- `tailwind.config.ts` — Tailwind config

## Dev commands

```bash
npm run dev      # start Next.js dev server
npm run build    # production build
npm run test     # run Vitest tests
```

## Important notes

- All UI text is in **Russian**
- Supabase is the single source of truth — no other DB
- XP system: students earn XP per lesson/homework, displayed in leaderboard
- File uploads (homework) go to Cloudflare R2 via S3 SDK
- Sentry is wired for both client and server error tracking
- The project is tracked for a thesis/diploma — correctness and completeness matter
