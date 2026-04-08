"use client";

import { useState, useMemo, useCallback, memo, useEffect } from "react";
import dynamic from "next/dynamic";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageTransition } from "@/components/layout/PageTransition";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";

const ConfirmDialog = dynamic(
  () => import("@/components/ui/ConfirmDialog").then((m) => m.ConfirmDialog),
  { ssr: false }
);
import { useUserStore } from "@/store/userStore";
import { useProgressStore } from "@/store/progressStore";
import { getLevelByXP, getProgressToNextLevel, getNextLevel } from "@/lib/xp";
import { lessons } from "@/data/lessons";
import { getLessonFinishContent } from "@/data/lessonFinish";
import { shopItems } from "@/data/shop";
import type { AvatarId } from "@/types";
import Link from "next/link";
import { cn, clamp100 } from "@/lib/utils";


/* ── Lesson list row ─────────────────────────────────────────────────────── */

interface LessonCardProps {
  lesson: { id: string; order: number; title: string };
  unlocked: boolean;
  completed: boolean;
  isCurrent: boolean;
  stepsCompleted: number;
  totalSteps: number;
  awaitingApproval?: boolean;
}

const LessonNavItem = memo(function LessonNavItem({
  lesson, unlocked, completed, isCurrent, stepsCompleted, totalSteps, awaitingApproval,
}: LessonCardProps) {
  return (
    <Link
      href={unlocked ? `/lesson/${lesson.id}` : "#"}
      className={cn(!unlocked && "pointer-events-none")}
    >
      <div className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150",
        isCurrent && !completed
          ? "bg-primary/[0.07] ring-1 ring-primary/20"
          : completed
          ? "bg-success/[0.04]"
          : unlocked
          ? "hover:bg-gray-50"
          : "opacity-40"
      )}>
        {/* Order / status */}
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0",
          completed        ? "bg-success/15 text-success" :
          awaitingApproval ? "bg-amber-100 text-amber-600" :
          isCurrent        ? "bg-primary text-white" :
          "bg-gray-100 text-text-muted"
        )}>
          {completed ? "✓" : awaitingApproval ? "⏳" : !unlocked ? "🔒" : lesson.order}
        </div>

        {/* Label */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-[13px] font-semibold leading-tight truncate",
            !unlocked && !awaitingApproval ? "text-text/40" : "text-text"
          )}>{lesson.title}</p>

          {awaitingApproval && (
            <p className="text-[10px] text-amber-600 font-medium mt-0.5">Ожидает одобрения</p>
          )}
        </div>

        {/* Progress dots — only for in-progress, non-current */}
        {unlocked && !completed && stepsCompleted > 0 && !isCurrent && (
          <div className="flex gap-0.5 flex-shrink-0">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  i < stepsCompleted ? "bg-primary" : "bg-gray-200"
                )}
              />
            ))}
          </div>
        )}

        {/* Current dot */}
        {isCurrent && !completed && (
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse-soft flex-shrink-0" />
        )}
      </div>
    </Link>
  );
});


/* ── Helpers ──────────────────────────────────────────────────────────────── */

function streakLabel(n: number) {
  if (n === 1) return "день";
  if (n < 5)  return "дня";
  return "дней";
}

interface AppNotification {
  id: string;
  type: string;
  message: string;
  lessonId?: string;
  read: boolean;
}


/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const user         = useUserStore((s) => s.user);
  const xp           = useUserStore((s) => s.xp);
  const streak       = useUserStore((s) => s.streak);
  const purchasedIds = useUserStore((s) => s.purchasedIds);
  const clearCourseState = useUserStore((s) => s.clearCourseState);
  const showToast    = useUserStore((s) => s.showToast);
  const resetAllProgress = useProgressStore((s) => s.resetAll);
  const { isLessonCompleted, isLessonUnlocked, getLesson } = useProgressStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.ok ? r.json() : [])
      .then((data: AppNotification[]) => setNotifications(data.filter((n) => !n.read)))
      .catch(() => {});
  }, []);

  const dismissNotifications = useCallback(() => {
    setNotifications([]);
    fetch("/api/notifications", { method: "PATCH" }).catch(() => {});
  }, []);

  const sortedLessons = useMemo(
    () => [...lessons].sort((a, b) => a.order - b.order),
    []
  );
  const latestLessonId = sortedLessons[sortedLessons.length - 1]?.id;
  const hasLessons = sortedLessons.length > 0;
  const level = useMemo(() => getLevelByXP(xp), [xp]);
  const levelProgress = useMemo(() => getProgressToNextLevel(xp), [xp]);
  const nextLevel = useMemo(() => getNextLevel(xp), [xp]);

  const completedCount = useMemo(
    () => hasLessons ? sortedLessons.filter((l) => isLessonCompleted(l.id)).length : 0,
    [hasLessons, sortedLessons, isLessonCompleted]
  );
  const courseProgress = useMemo(
    () => hasLessons ? clamp100((completedCount / sortedLessons.length) * 100) : 0,
    [hasLessons, completedCount, sortedLessons.length]
  );

  const currentLesson = useMemo(
    () => hasLessons
      ? (sortedLessons.find((l) => isLessonUnlocked(l.id) && !isLessonCompleted(l.id)) ?? sortedLessons[sortedLessons.length - 1])
      : null,
    [hasLessons, sortedLessons, isLessonUnlocked, isLessonCompleted]
  );

  const cp = currentLesson ? getLesson(currentLesson.id) : null;
  const stepsCompleted = useMemo(() => {
    if (!cp || !currentLesson) return 0;
    if (Object.keys(cp.steps).length > 0) {
      return Object.values(cp.steps).filter((s) => s.done).length;
    }
    return [cp.reviewDone, cp.practiceDone, cp.homeworkStatus === "submitted"].filter(Boolean).length;
  }, [cp, currentLesson]);

  const isStarted   = stepsCompleted > 0;
  const isCompleted = currentLesson ? isLessonCompleted(currentLesson.id) : false;

  const activeStepIdx = useMemo(() => {
    if (!currentLesson || isCompleted) return -1;
    return currentLesson.steps.findIndex((s) => !(cp?.steps[s.id]?.done));
  }, [currentLesson, isCompleted, cp]);
  const activeStep = activeStepIdx >= 0 ? currentLesson?.steps[activeStepIdx] : null;

  const totalEstimatedMin = useMemo(
    () => currentLesson?.steps.reduce((sum, s) => sum + s.estimatedMin, 0) ?? 0,
    [currentLesson]
  );

  const affordableCount = useMemo(
    () => shopItems.filter((i) => !purchasedIds.includes(i.id) && xp >= i.cost).length,
    [purchasedIds, xp]
  );

  const handleResetProgress = useCallback(async () => {
    if (isResetting) return;
    setIsResetting(true);
    try {
      const res = await fetch("/api/progress", { method: "DELETE" });
      const data = await res.json().catch(() => null) as { avatarId?: AvatarId; error?: string } | null;
      if (!res.ok) throw new Error(data?.error ?? "Reset failed");
      clearCourseState({ avatarId: data?.avatarId, clearCosmetics: true });
      resetAllProgress();
      setConfirmReset(false);
      showToast("Прогресс очищен", "Уроки, XP и покупки сброшены.");
    } catch {
      showToast("Сброс не удался", "Попробуй ещё раз через пару секунд.");
    } finally {
      setIsResetting(false);
    }
  }, [clearCourseState, isResetting, resetAllProgress, showToast]);

  return (
    <AppLayout wide>
      <PageTransition>
        <div className="pt-6 md:pt-8 pb-12">

          {/* ── Notifications ── */}
          {notifications.length > 0 && (
            <div className="mb-6 space-y-2">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "flex items-start justify-between gap-3 px-5 py-4 rounded-2xl border text-sm font-medium",
                    n.type === "homework_approved"
                      ? "bg-green-50 border-green-200 text-green-800"
                      : "bg-amber-50 border-amber-200 text-amber-800"
                  )}
                >
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <span className="text-base mt-0.5 shrink-0">
                      {n.type === "homework_approved" ? "✅" : "💬"}
                    </span>
                    <span className="leading-snug">{n.message}</span>
                  </div>
                  <button
                    onClick={dismissNotifications}
                    className="text-lg leading-none opacity-50 hover:opacity-80 transition-opacity shrink-0 mt-0.5"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── Header ── */}
          <div className="flex items-center justify-between mb-8 gap-4">
            <div>
              <p className="text-text-muted text-sm font-medium leading-none mb-1">Привет,</p>
              <h1 className="text-3xl md:text-4xl font-black text-text tracking-tight leading-none">
                {user?.name ?? "Ученик"} 👋
              </h1>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {streak > 0 && (
                <div className="hidden sm:flex items-center gap-2 bg-warning/8 border border-warning/20 px-3.5 py-2 rounded-2xl">
                  <span className="text-base">🔥</span>
                  <span className="font-black text-warning text-sm">{streak}</span>
                  <span className="text-text-muted text-xs">{streakLabel(streak)} подряд</span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-[#1A1A2E] px-4 py-2.5 rounded-2xl shadow-dark">
                <span className="text-accent">⚡</span>
                <span className="font-black text-white text-lg tracking-tight">{xp}</span>
                <span className="text-white/40 text-sm font-medium">XP</span>
              </div>
            </div>
          </div>

          {/* ── Main grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">

            {/* ─── Hero: current lesson ─── */}
            <div className="lg:col-span-2 relative bg-[#1A1A2E] rounded-3xl overflow-hidden flex flex-col">
              {/* Subtle decorative blobs */}
              <div className="absolute -right-20 -top-20 w-72 h-72 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute left-1/4 -bottom-16 w-56 h-56 bg-accent/6 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 p-7 md:p-8 flex flex-col flex-1">
                {/* Status pill */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-white/10 text-white/50 text-[11px] font-bold px-3 py-1.5 rounded-full tracking-widest uppercase">
                    {currentLesson ? `Урок ${currentLesson.order} из ${sortedLessons.length}` : "Курс пуст"}
                  </span>
                  {isCompleted && (
                    <span className="bg-accent/20 text-accent text-[11px] font-black px-3 py-1.5 rounded-full">
                      ✓ Завершён
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-white text-2xl md:text-[28px] font-black leading-tight mb-2 max-w-lg">
                  {currentLesson?.title ?? "Уроки скоро появятся"}
                </h2>

                {/* Description */}
                <p className="text-white/40 text-sm leading-relaxed mb-5 max-w-md line-clamp-2">
                  {currentLesson?.description ?? "Добавь первый урок, и дашборд автоматически подхватит его."}
                </p>

                {/* ── Stepper: light inline flow ── */}
                {currentLesson && currentLesson.steps.length > 0 && (
                  <div className="flex items-center gap-1 mb-6">
                    {currentLesson.steps.map((step, i) => {
                      const done   = cp?.steps[step.id]?.done ?? false;
                      const isNext = !done && i === activeStepIdx && !isCompleted;
                      const isLast = i === currentLesson.steps.length - 1;

                      return (
                        <div key={step.id} className="flex items-center flex-1 min-w-0">
                          {/* Step pill */}
                          <div
                            className={cn(
                              "flex items-center gap-1.5 flex-1 py-2 px-2.5 rounded-xl transition-all select-none min-w-0",
                              done
                                ? "bg-accent/20"
                                : isNext
                                ? "bg-white/10 ring-1 ring-white/15"
                                : "bg-white/[0.04]"
                            )}
                          >
                            <span className={cn(
                              "text-sm leading-none flex-shrink-0",
                              done ? "text-accent" : isNext ? "text-white/70" : "text-white/15"
                            )}>
                              {done ? "✓" : step.icon}
                            </span>
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-wide truncate leading-none",
                              done ? "text-accent/80" : isNext ? "text-white/60" : "text-white/15"
                            )}>
                              {step.label}
                            </span>
                          </div>

                          {/* Connector */}
                          {!isLast && (
                            <div className={cn(
                              "w-2 h-[2px] flex-shrink-0 mx-0.5",
                              done ? "bg-accent/30" : "bg-white/8"
                            )} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── CTA area ── */}
                <div className="mt-auto flex items-center gap-4">
                  {currentLesson ? (
                    <>
                      <Link href={`/lesson/${currentLesson.id}`}>
                        <Button variant="accent" className="font-black text-[15px] px-7 h-11">
                          {isCompleted
                            ? "Повторить"
                            : isStarted
                            ? "Продолжить →"
                            : "Начать урок →"}
                        </Button>
                      </Link>
                      {/* Next step hint */}
                      {activeStep && !isCompleted && (
                        <span className="text-white/30 text-xs font-medium hidden sm:inline">
                          {activeStep.icon} {activeStep.label} · ~{totalEstimatedMin} мин
                        </span>
                      )}
                    </>
                  ) : (
                    <Button variant="secondary" className="font-black" disabled>
                      Уроков пока нет
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* ─── Right column: lesson list ─── */}
            <div className="lg:col-span-1 bg-white rounded-3xl border border-gray-100 shadow-card flex flex-col overflow-hidden">
              {/* Header */}
              <div className="px-4 pt-4 pb-3 border-b border-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
                    Уроки
                  </p>
                  <span className="text-[11px] font-bold text-text-muted">
                    {completedCount}/{sortedLessons.length}
                  </span>
                </div>
                {sortedLessons.length > 0 && (
                  <ProgressBar value={courseProgress} color="primary" size="xs" />
                )}
              </div>

              {/* Items */}
              <div className="flex-1 p-2 flex flex-col gap-0.5 overflow-y-auto">
                {sortedLessons.map((lesson) => {
                  const unlocked  = isLessonUnlocked(lesson.id);
                  const completed = isLessonCompleted(lesson.id);
                  const isCurrent = lesson.id === currentLesson?.id;
                  const lp = getLesson(lesson.id);
                  const totalSteps = lesson.steps.length || 3;
                  const lSteps = Object.keys(lp.steps).length > 0
                    ? Object.values(lp.steps).filter((s) => s.done).length
                    : [lp.reviewDone, lp.practiceDone, lp.homeworkStatus === "submitted"].filter(Boolean).length;
                  const awaitingApproval = !unlocked && lp.homeworkStatus === "submitted";
                  return (
                    <LessonNavItem
                      key={lesson.id}
                      lesson={lesson}
                      unlocked={unlocked}
                      completed={completed}
                      isCurrent={isCurrent}
                      stepsCompleted={lSteps}
                      totalSteps={totalSteps}
                      awaitingApproval={awaitingApproval}
                    />
                  );
                })}
              </div>
            </div>

          </div>

          {/* ── Bottom row: progress + level ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Course progress — text only, bar is already in right column */}
            <div className="bg-white rounded-2xl px-5 py-4 border border-gray-100 shadow-card flex items-center gap-5">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">
                  Прогресс курса
                </p>
                <ProgressBar value={courseProgress} color="primary" size="sm" />
                <p className="text-xs text-text-muted mt-1.5">
                  <span className="font-bold text-text">{completedCount}</span> из {sortedLessons.length} уроков · {courseProgress}%
                </p>
              </div>
            </div>

            {/* Level progression — shows progress to NEXT level, not raw XP */}
            <div className="bg-white rounded-2xl px-5 py-4 border border-gray-100 shadow-card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">
                  Уровень
                </p>
                <span className="text-[11px] font-bold text-text-muted">Ур. {level.level}</span>
              </div>
              <p className="text-base font-black text-primary leading-none mb-2">{level.label}</p>
              {nextLevel ? (
                <>
                  <ProgressBar value={levelProgress} color="accent" size="xs" />
                  <p className="text-[11px] text-text-muted mt-1.5">
                    До «{nextLevel.label}»: <span className="font-bold text-primary">{nextLevel.minXP - xp} XP</span>
                  </p>
                </>
              ) : (
                <p className="text-[11px] text-success font-bold">Максимальный уровень!</p>
              )}
            </div>

          </div>

          {/* ── Shop banner ── */}
          {affordableCount > 0 && (
            <Link href="/shop" className="block mt-4">
              <div className="bg-accent rounded-2xl px-5 py-4 flex items-center gap-4 hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer shadow-accent">
                <div className="w-10 h-10 bg-[#1A1A2E] rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                  🛍️
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-[#1A1A2E] text-sm">
                    {affordableCount === 1
                      ? "Доступен 1 товар в магазине"
                      : `Доступно ${affordableCount} товара в магазине`}
                  </p>
                </div>
                <span className="text-[#1A1A2E]/40 text-lg font-black flex-shrink-0">→</span>
              </div>
            </Link>
          )}

        </div>
      </PageTransition>

      <ConfirmDialog
        open={confirmReset}
        title="Очистить прогресс?"
        description="Весь прогресс уроков, XP и покупки будут удалены. Это действие нельзя отменить."
        confirmLabel={isResetting ? "Очищаем..." : "Очистить"}
        danger
        confirmLoading={isResetting}
        confirmDisabled={isResetting}
        cancelDisabled={isResetting}
        onConfirm={handleResetProgress}
        onCancel={() => setConfirmReset(false)}
      />
    </AppLayout>
  );
}
