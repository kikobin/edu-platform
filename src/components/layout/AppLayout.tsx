"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

// Deferred — never needed for first paint, only after user interaction.
const XPPopup     = dynamic(() => import("@/components/xp/XPPopup").then((m) => m.XPPopup), { ssr: false });
const StatusToast = dynamic(() => import("@/components/ui/StatusToast").then((m) => m.StatusToast), { ssr: false });
import { useUserStore } from "@/store/userStore";
import { useProgressStore } from "@/store/progressStore";
import { useLessonEvents } from "@/hooks/useLessonEvents";
import { useSession } from "@/hooks/useSession";
import { NotificationsProvider } from "@/context/NotificationsContext";
import { storage } from "@/lib/storage";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children:  React.ReactNode;
  hideNav?:  boolean;
  wide?:     boolean;
  fluid?:    boolean;
}

export function AppLayout({ children, hideNav = false, wide = false, fluid = false }: AppLayoutProps) {
  useLessonEvents(); // central subscriber for XP rewards and future achievement hooks
  useSession();     // validates JWT on mount, syncs fresh profile, redirects on 401

  const initUser          = useUserStore((s) => s.initFromStorage);
  const reconcileXP         = useUserStore((s) => s.reconcileXP);
  const reconcilePurchases  = useUserStore((s) => s.reconcilePurchases);
  const clearCourseState    = useUserStore((s) => s.clearCourseState);
  const initProgress      = useProgressStore((s) => s.initFromStorage);
  const mergeServerProgress = useProgressStore((s) => s.mergeServerProgress);
  const showToast         = useUserStore((s) => s.showToast);
  const [isReady, setIsReady] = useState(false);

  // Reactive user id: becomes truthy either from localStorage (instant) or
  // from useSession → login() when localStorage was cleared but JWT is still valid.
  const userId = useUserStore((s) => s.user?.id);

  // Track whether progress has been initialized to prevent double-init on re-renders.
  const progressInitialized = useRef(false);

  // Step 1: Hydrate user store from localStorage on mount (synchronous, instant).
  useEffect(() => {
    initUser();
    // After initUser(), if no user was found in localStorage, userId will remain null.
    // useSession is running concurrently and will call login(fresh) if the JWT is valid,
    // which sets userId → triggers the effect below → completes initialization.
    // If JWT is also invalid, useSession calls logout() and redirects to /login.
  }, [initUser]);

  // Step 2: Initialize progress and trigger server sync once userId is known.
  // Runs whether userId came from localStorage (fast path) or from useSession (slow path).
  useEffect(() => {
    if (!userId || progressInitialized.current) return;
    progressInitialized.current = true;

    initProgress(userId);
    setIsReady(true);

    // Background server reconciliation — runs after the page is interactive.
    // Forward-only: any progress done on the server but missing locally is applied.
    // Never blocks the initial render or shows a loading state.
    const runSync = () => {
      fetch("/api/progress")
        .then((r) => r.ok ? r.json() : null)
        .then((data: { xp: number; lessons: Parameters<typeof mergeServerProgress>[0]; purchasedIds: string[] } | null) => {
          if (!data) return;

          // ── Server-side reset detection ────────────────────────────────────
          // If server returns xp=0 and no lesson rows, an admin wiped the DB.
          // Trust the server and clear all local state so students see a fresh start.
          const localXP = useUserStore.getState().xp;
          const localPurchases = useUserStore.getState().purchasedIds;
          if (data.xp === 0 && data.lessons.length === 0 && data.purchasedIds.length === 0 && (localXP > 0 || localPurchases.length > 0)) {
            clearCourseState();
            useProgressStore.getState().resetAll();
            return;
          }

          reconcileXP(data.xp);
          mergeServerProgress(data.lessons);
          if (data.purchasedIds?.length) reconcilePurchases(data.purchasedIds);
        })
        .catch(() => {}); // silent — local state is always the fallback
    };

    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(runSync, { timeout: 4000 });
    } else {
      setTimeout(runSync, 2000);
    }
  }, [userId, clearCourseState, initProgress, reconcileXP, reconcilePurchases, mergeServerProgress]);

  // Предупреждение если localStorage недоступен (incognito / квота)
  useEffect(() => {
    if (storage.isEphemeral()) {
      showToast("Приватный режим", "Прогресс не сохранится после закрытия вкладки.");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Уведомление при ошибке записи в localStorage (квота / приватный режим)
  useEffect(() => {
    const handleStorageError = () => {
      showToast("Ошибка сохранения", "Хранилище браузера недоступно — прогресс не сохранится.");
    };
    window.addEventListener("edu:storage:error", handleStorageError);
    return () => window.removeEventListener("edu:storage:error", handleStorageError);
  }, [showToast]);

  // Синхронизация между вкладками: если другая вкладка обновила данные — перечитываем стор.
  // Debounce-им чтобы серия быстрых write-ов не вызвала несколько полных реинитов.
  useEffect(() => {
    let crossTabTimer: ReturnType<typeof setTimeout> | null = null;
    const handleCrossTab = (e: StorageEvent) => {
      if (!e.key?.startsWith("edu_")) return;
      if (crossTabTimer) clearTimeout(crossTabTimer);
      crossTabTimer = setTimeout(() => {
        initUser();
        const userId = useUserStore.getState().user?.id;
        if (userId) initProgress(userId);
        crossTabTimer = null;
      }, 300);
    };
    window.addEventListener("storage", handleCrossTab);
    return () => {
      window.removeEventListener("storage", handleCrossTab);
      if (crossTabTimer) clearTimeout(crossTabTimer);
    };
  }, [initUser, initProgress]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-11 h-11 rounded-2xl border-4 border-primary/15 border-t-primary animate-spin" />
          <div>
            <p className="font-bold text-text">Загружаем платформу</p>
            <p className="text-sm text-text-muted">Подтягиваем твой прогресс и уроки</p>
          </div>
        </div>
      </div>
    );
  }

  if (hideNav) {
    return (
      <NotificationsProvider>
        <div className="min-h-screen bg-bg">
          {/* Сайдбар показываем на десктопе — он сам hidden md:flex */}
          <Sidebar />
          <div className="md:ml-64 min-h-screen">
            {children}
          </div>
          {/* BottomNav скрываем — на уроке мешает */}
          <XPPopup />
          <StatusToast />
        </div>
      </NotificationsProvider>
    );
  }

  return (
    <NotificationsProvider>
      <div className="min-h-screen bg-bg">
        <Sidebar />
        <div className="md:ml-64 min-h-screen">
          <main className={cn(
            "w-full pb-24 md:pb-10",
            !fluid && "mx-auto md:px-8",
            !fluid && (wide ? "max-w-6xl" : "max-w-3xl")
          )}>
            {children}
          </main>
        </div>
        <BottomNav />
        <XPPopup />
        <StatusToast />
      </div>
    </NotificationsProvider>
  );
}
