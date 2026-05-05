"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageTransition } from "@/components/layout/PageTransition";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CheckIcon, PencilIcon, CloseIcon } from "@/components/brand/Icon";
import { useUserStore } from "@/store/userStore";
import { getLevelByXP, getProgressToNextLevel, getNextLevel } from "@/lib/xp";
import { shopItems } from "@/data/shop";
import { MODULES } from "@/content/study-modules";
import { getLessonsByModule } from "@/content/study-lessons";
import { cn } from "@/lib/utils";

const ConfirmDialog = dynamic(
  () => import("@/components/ui/ConfirmDialog").then((m) => m.ConfirmDialog),
  { ssr: false }
);

interface AppNotification {
  id: string;
  type: string;
  message: string;
  lessonId?: string;
  read: boolean;
}

function streakLabel(n: number) {
  if (n === 1) return "день";
  if (n < 5) return "дня";
  return "дней";
}

export default function DashboardPage() {
  const user         = useUserStore((s) => s.user);
  const xp           = useUserStore((s) => s.xp);
  const streak       = useUserStore((s) => s.streak);
  const purchasedIds = useUserStore((s) => s.purchasedIds);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: AppNotification[]) => setNotifications(data.filter((n) => !n.read)))
      .catch(() => {});
  }, []);

  const dismissNotifications = () => {
    setNotifications([]);
    fetch("/api/notifications", { method: "PATCH" }).catch(() => {});
  };

  const level = useMemo(() => getLevelByXP(xp), [xp]);
  const levelProgress = useMemo(() => getProgressToNextLevel(xp), [xp]);
  const nextLevel = useMemo(() => getNextLevel(xp), [xp]);

  const affordableCount = useMemo(
    () => shopItems.filter((i) => !purchasedIds.includes(i.id) && xp >= i.cost).length,
    [purchasedIds, xp]
  );

  return (
    <AppLayout wide>
      <PageTransition>
        <div className="pt-6 md:pt-8 pb-12">
          {/* Notifications */}
          {notifications.length > 0 && (
            <div className="mb-6 space-y-2">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "flex items-start justify-between gap-3 px-4 py-3 rounded-lg border text-[13px]",
                    n.type === "homework_approved"
                      ? "bg-success/8 border-success/20 text-success/90"
                      : "bg-error-light border-error/20 text-error"
                  )}
                >
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <span className="mt-0.5 shrink-0">
                      {n.type === "homework_approved"
                        ? <CheckIcon size={16} className="text-success" />
                        : <PencilIcon size={16} className="text-error" />}
                    </span>
                    <span className="leading-snug">{n.message}</span>
                  </div>
                  <button
                    onClick={dismissNotifications}
                    className="opacity-50 hover:opacity-80 transition-opacity shrink-0 mt-0.5"
                    aria-label="Скрыть"
                  >
                    <CloseIcon size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Header */}
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

          {/* Module cards */}
          <div className="mb-8">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-text-muted mb-4">
              Модули
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MODULES.map((m) => {
                const lessons = getLessonsByModule(m.slug, user?.tier);
                const isSoon = m.status === "soon";
                return (
                  <Link
                    key={m.slug}
                    href={isSoon ? "#" : `/modules/${m.slug}`}
                    aria-disabled={isSoon}
                    onClick={(e) => isSoon && e.preventDefault()}
                    className={cn(
                      "group relative bg-white rounded-3xl border border-purple-100/80 shadow-sm p-6 transition-all overflow-hidden",
                      !isSoon && "hover:border-primary/30 hover:shadow-card-md",
                      isSoon && "opacity-70 cursor-not-allowed"
                    )}
                  >
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/8 rounded-full blur-2xl pointer-events-none" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary">
                          Модуль {m.id}
                        </p>
                        {isSoon && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Скоро
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl font-black text-text leading-tight mb-2">
                        {m.title}
                      </h2>
                      <p className="text-sm text-text-muted leading-relaxed mb-4 line-clamp-2">
                        {m.subtitle}
                      </p>
                      <p className="text-xs text-text-muted/80">
                        {isSoon ? `${m.lessonCount} уроков скоро` : `${lessons.length} уроков`}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Level + shop banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    До «{nextLevel.label}»:{" "}
                    <span className="font-bold text-primary">{nextLevel.minXP - xp} XP</span>
                  </p>
                </>
              ) : (
                <p className="text-[11px] text-success font-bold">Максимальный уровень!</p>
              )}
            </div>

            {affordableCount > 0 && (
              <Link href="/shop" className="block">
                <div className="bg-accent rounded-2xl px-5 py-4 h-full flex items-center gap-4 hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer shadow-accent">
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
        </div>
      </PageTransition>

      <ConfirmDialog
        open={confirmReset}
        title="Очистить прогресс?"
        description="Весь прогресс будет удалён. Это действие нельзя отменить."
        confirmLabel="Очистить"
        danger
        onConfirm={() => setConfirmReset(false)}
        onCancel={() => setConfirmReset(false)}
      />
    </AppLayout>
  );
}
