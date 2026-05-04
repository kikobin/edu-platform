"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { PageTransition } from "@/components/layout/PageTransition";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useUserStore } from "@/store/userStore";
import { useProgressStore } from "@/store/progressStore";
import { getLevelByXP, getProgressToNextLevel, getNextLevel } from "@/lib/xp";
import { lessons } from "@/data/lessons";
import { shopItems } from "@/data/shop";
import { AvatarDisplay } from "@/components/profile/AvatarDisplay";
import { cn, clamp100 } from "@/lib/utils";
import type { AvatarId } from "@/types";

const AVATARS: AvatarId[] = [
  "avatar_1", "avatar_2", "avatar_3", "avatar_4",
  "avatar_5", "avatar_6", "avatar_7", "avatar_8",
];

export default function ProfilePage() {
  const user         = useUserStore((s) => s.user);
  const xp           = useUserStore((s) => s.xp);
  const streak       = useUserStore((s) => s.streak);
  const updateAvatar = useUserStore((s) => s.updateAvatar);
  const { isLessonCompleted, getLesson } = useProgressStore();

  const level     = getLevelByXP(xp);
  const progress  = clamp100(getProgressToNextLevel(xp));
  const nextLevel = getNextLevel(xp);

  const completedLessons   = lessons.filter((l) => isLessonCompleted(l.id)).length;
  const submittedHomeworks = lessons.filter((l) => getLesson(l.id).homeworkStatus === "submitted").length;
  const totalLessons       = lessons.length;

  // If user isn't populated yet, render a visible loader inside AppLayout.
  // Returning an empty <div /> produced an apparently blank screen when AppLayout
  // had already passed its own ready-gate. AppLayout + useSession handle the
  // redirect to /login if the session is actually invalid.
  if (!user) {
    return (
      <AppLayout wide>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="w-10 h-10 rounded-2xl border-4 border-primary/15 border-t-primary animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const equippedTitle = user.titleId ? shopItems.find((i) => i.id === user.titleId) : null;
  const equippedFrame = user.frameId ? shopItems.find((i) => i.id === user.frameId) : null;

  const stats = [
    {
      icon: "📚", value: completedLessons, label: "Уроков пройдено",
      bg: "bg-violet-50", fg: "text-violet-600", border: "border-violet-100",
    },
    {
      icon: "✅", value: submittedHomeworks, label: "Домашек сдано",
      bg: "bg-emerald-50", fg: "text-emerald-600", border: "border-emerald-100",
    },
    {
      icon: "🔥", value: streak, label: "Дней подряд",
      bg: "bg-orange-50", fg: "text-orange-500", border: "border-orange-100",
    },
  ];

  const achievements = [
    { icon: "🎯", label: "Первый шаг",    desc: "Пройди первый урок",     unlocked: completedLessons >= 1 },
    { icon: "📚", label: "Книжный червь", desc: "Пройди 5 уроков",        unlocked: completedLessons >= 5 },
    { icon: "🏆", label: "Студент",       desc: "Пройди 10 уроков",       unlocked: completedLessons >= 10 },
    { icon: "✏️", label: "Прилежный",     desc: "Сдай 1 домашнее",        unlocked: submittedHomeworks >= 1 },
    { icon: "🔥", label: "Огонёк",        desc: "3 дня подряд",           unlocked: streak >= 3 },
    { icon: "⚡", label: "Неделька",      desc: "7 дней подряд",          unlocked: streak >= 7 },
    { icon: "💫", label: "XP-охотник",    desc: "Набери 100 XP",          unlocked: xp >= 100 },
    { icon: "🌟", label: "Уровень 2",     desc: "Достигни 2-го уровня",   unlocked: level.level >= 2 },
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const goals = [
    {
      label: "Уроки завершены", current: completedLessons,
      target: Math.max(totalLessons, 1), unit: "уроков", color: "primary" as const,
    },
    {
      label: "Домашние задания", current: submittedHomeworks,
      target: Math.max(totalLessons, 1), unit: "домашек", color: "success" as const,
    },
    {
      label: "Серия дней", current: streak,
      target: Math.max(7, streak), unit: "дней", color: "accent" as const,
    },
    {
      label: "Опыт до следующего", current: nextLevel ? xp - level.minXP : xp,
      target: nextLevel ? nextLevel.minXP - level.minXP : Math.max(xp, 1), unit: "XP", color: "primary" as const,
    },
  ];

  return (
    <AppLayout wide>
      <PageTransition>

        {/* ─── HEADER ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 md:px-0 pt-6 pb-5">
          <div>
            <h1 className="text-2xl font-black text-text tracking-tight">Профиль</h1>
            <p className="text-sm text-text-muted mt-0.5">Твой прогресс и достижения</p>
          </div>
          <div className="flex items-center gap-1.5 bg-dark px-4 py-2 rounded-xl">
            <span className="text-accent text-base">⚡</span>
            <span className="font-black text-white text-sm">{xp} XP</span>
          </div>
        </div>

        <div className="px-4 md:px-0 pb-10 flex flex-col gap-5">

          {/* ─── ROW 1: Identity + Stats ────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Profile Identity Card */}
            <div className="bg-dark rounded-3xl p-7 flex flex-col items-center text-center relative overflow-hidden">
              {/* Decorative blobs */}
              <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-primary/20 rounded-full pointer-events-none" />
              <div className="absolute -left-8 -top-8 w-36 h-36 bg-accent/10 rounded-full pointer-events-none" />
              <div className="absolute top-5 right-5 w-2 h-2 bg-accent rounded-full pointer-events-none" />
              <div className="absolute top-10 right-10 w-1.5 h-1.5 bg-primary/60 rounded-full pointer-events-none" />

              {/* Avatar */}
              <div className="relative z-10 mt-1 p-2 bg-white/10 rounded-2xl">
                <AvatarDisplay avatarId={user.avatarId} size="lg" frameId={equippedFrame?.id} />
              </div>

              {/* Name */}
              <h2 className="text-white text-xl font-black mt-4 relative z-10 leading-tight">
                {user.name}
              </h2>

              {equippedTitle && (
                <p className="text-accent/80 text-xs font-semibold mt-1 relative z-10">
                  {equippedTitle.preview} {equippedTitle.name}
                </p>
              )}

              {/* Level badge */}
              <div className="flex items-center gap-2 mt-3 relative z-10">
                <span className="bg-primary/30 text-blue-200 text-xs font-bold px-2.5 py-1 rounded-lg">
                  Ур. {level.level}
                </span>
                <span className="text-white/60 text-xs">{level.label}</span>
              </div>

              {/* Progress bar */}
              <div className="w-full mt-5 relative z-10">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-white/40 font-medium">До следующего уровня</span>
                  {nextLevel && (
                    <span className="text-accent font-bold">{nextLevel.minXP - xp} XP</span>
                  )}
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-700"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* XP badge */}
              <div className="flex items-center gap-1.5 mt-5 bg-accent/20 px-4 py-2 rounded-xl relative z-10">
                <span className="text-accent text-sm">⚡</span>
                <span className="text-white font-black text-sm">{xp} XP</span>
              </div>
            </div>

            {/* Right column: Stats + Level card */}
            <div className="lg:col-span-2 flex flex-col gap-4">

              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-4">
                {stats.map(({ icon, value, label, bg, fg, border }) => (
                  <div
                    key={label}
                    className={cn(
                      "bg-white rounded-2xl shadow-card border p-5 flex flex-col items-center text-center",
                      border,
                    )}
                  >
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3", bg)}>
                      {icon}
                    </div>
                    <p className="text-3xl font-black text-text leading-none">{value}</p>
                    <p className={cn("text-xs font-semibold mt-2 leading-tight text-center", fg)}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Level / progress card */}
              <div className="flex-1 bg-white rounded-2xl shadow-card border border-border p-6 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xs text-text-muted font-semibold uppercase tracking-widest">
                      Текущий уровень
                    </p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <p className="font-black text-text text-2xl leading-tight">{level.label}</p>
                      <span className="text-sm font-bold text-text-muted">#{level.level}</span>
                    </div>
                  </div>

                  {nextLevel ? (
                    <div className="text-right bg-primary-light px-3 py-2 rounded-xl">
                      <p className="text-2xs text-primary font-semibold">Следующий</p>
                      <p className="text-sm font-black text-primary">{nextLevel.label}</p>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-100 px-3 py-2 rounded-xl">
                      <p className="text-xs font-black text-yellow-700">🏆 Максимум</p>
                    </div>
                  )}
                </div>

                <div className="mt-5">
                  <ProgressBar value={progress} color="primary" size="md" />
                  <div className="flex items-center justify-between mt-2.5">
                    {nextLevel ? (
                      <p className="text-sm text-text-muted">
                        Ещё{" "}
                        <span className="font-black text-primary">{nextLevel.minXP - xp} XP</span>
                        {" "}до{" "}
                        <span className="font-semibold text-text">{nextLevel.label}</span>
                      </p>
                    ) : (
                      <p className="text-sm text-success font-semibold">
                        Максимальный уровень достигнут!
                      </p>
                    )}
                    <span className="text-xs font-black text-text-muted bg-bg px-2 py-1 rounded-lg">
                      {progress}%
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ─── ROW 2: Avatar selection + Achievements ─────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Avatar selection */}
            <div className="bg-white rounded-2xl shadow-card border border-border p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
                  <span className="text-lg">🎭</span>
                </div>
                <div>
                  <p className="font-black text-text text-base">Выбери аватар</p>
                  <p className="text-xs text-text-muted">Нажми на любого персонажа</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 place-items-center">
                {AVATARS.map((avatarId) => (
                  <button
                    key={avatarId}
                    onClick={() => updateAvatar(avatarId)}
                    aria-label={`Выбрать аватар ${avatarId}`}
                    className={cn(
                      "rounded-2xl transition-all duration-200 focus:outline-none block w-fit",
                      "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                      user.avatarId === avatarId
                        ? "ring-[3px] ring-primary ring-offset-2 scale-105"
                        : "hover:scale-105 opacity-55 hover:opacity-100",
                    )}
                  >
                    <AvatarDisplay avatarId={avatarId} size="md" />
                  </button>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-2xl shadow-card border border-border p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-yellow-50 flex items-center justify-center shrink-0">
                  <span className="text-lg">🏅</span>
                </div>
                <div>
                  <p className="font-black text-text text-base">Достижения</p>
                  <p className="text-xs text-text-muted">
                    {unlockedCount} из {achievements.length} получено
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {achievements.map(({ icon, label, desc, unlocked }) => (
                  <div
                    key={label}
                    title={desc}
                    className={cn(
                      "flex flex-col items-center text-center p-3 rounded-xl border transition-all",
                      unlocked
                        ? "bg-yellow-50 border-yellow-100"
                        : "bg-bg border-border opacity-40 grayscale",
                    )}
                  >
                    <span className="text-2xl leading-none">{icon}</span>
                    <p
                      className={cn(
                        "text-2xs font-bold mt-1.5 leading-tight",
                        unlocked ? "text-yellow-700" : "text-text-muted",
                      )}
                    >
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ─── ROW 3: Goals + Summary ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* Learning goals */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-card border border-border p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
                  <span className="text-lg">🎯</span>
                </div>
                <div>
                  <p className="font-black text-text text-base">Цели обучения</p>
                  <p className="text-xs text-text-muted">Прогресс по ключевым показателям</p>
                </div>
              </div>
              <div className="flex flex-col gap-5">
                {goals.map(({ label, current, target, unit, color }) => {
                  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
                  return (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-text">{label}</span>
                        <span className="text-xs text-text-muted tabular-nums">
                          {current} / {target} {unit}
                        </span>
                      </div>
                      <ProgressBar value={pct} color={color} size="sm" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary card */}
            <div className="bg-dark rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-accent/15 rounded-full pointer-events-none" />
              <div className="absolute -left-6 -top-6 w-28 h-28 bg-primary/20 rounded-full pointer-events-none" />

              <div className="relative z-10">
                <p className="text-white/40 text-2xs font-semibold uppercase tracking-widest">Сводка</p>
                <p className="text-white font-black text-lg mt-0.5 leading-tight">Твоя статистика</p>
              </div>

              <div className="flex flex-col gap-3 relative z-10 mt-5">
                {[
                  { label: "Общий XP",   value: xp,              color: "text-accent" },
                  { label: "Уровень",    value: level.level,     color: "text-white" },
                  { label: "Прогресс",   value: `${progress}%`,  color: "text-white" },
                  { label: "Серия",      value: `${streak} 🔥`,  color: "text-orange-400" },
                  { label: "Достижений", value: `${unlockedCount}/${achievements.length}`, color: "text-yellow-400" },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between">
                      <span className="text-white/55 text-sm">{label}</span>
                      <span className={cn("font-black text-sm tabular-nums", color)}>{value}</span>
                    </div>
                    <div className="h-px bg-white/8 mt-3" />
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </PageTransition>
    </AppLayout>
  );
}
