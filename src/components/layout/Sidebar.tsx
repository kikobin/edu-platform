"use client";

import { memo, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { AvatarDisplay } from "@/components/profile/AvatarDisplay";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { getLevelByXP } from "@/lib/xp";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/dashboard",
    label: "Главная",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path d="M2 10L10 2L18 10V18H13V13H7V18H2V10Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: "/shop",
    label: "Магазин",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path d="M2 3H4.5L6.5 13H15.5L17.5 6H5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="8" cy="16.5" r="1" fill="currentColor"/>
        <circle cx="14" cy="16.5" r="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Профиль",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.8"/>
        <path d="M3 17C3 14.2 6.13 12 10 12C13.87 12 17 14.2 17 17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/leaderboard",
    label: "Рейтинг",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path d="M10 2L12.09 7.5H18L13.45 10.97L15.18 16.5L10 13.27L4.82 16.5L6.55 10.97L2 7.5H7.91L10 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

export const Sidebar = memo(function Sidebar() {
  const pathname = usePathname();
  const user    = useUserStore((s) => s.user);
  const xp      = useUserStore((s) => s.xp);
  const logout  = useUserStore((s) => s.logout);
  const level   = useMemo(() => getLevelByXP(xp), [xp]);
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white border-r border-gray-100 fixed left-0 top-0 z-40">
        {/* Лого */}
        <div className="px-6 pt-7 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#1A1A2E] rounded-xl flex items-center justify-center">
              <span className="text-accent font-black text-base">E</span>
            </div>
            <span className="font-black text-text text-lg tracking-tight">EduPlatform</span>
          </div>
        </div>

        {/* Навигация */}
        <nav className="flex-1 px-3 flex flex-col gap-0.5">
          {navItems.map(({ href, label, icon }) => {
            const active =
              pathname === href ||
              (pathname.startsWith("/lesson") && href === "/dashboard");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-150",
                  active
                    ? "bg-primary text-white"
                    : "text-text-muted hover:bg-gray-50 hover:text-text"
                )}
              >
                <span className={active ? "text-white" : ""}>{icon}</span>
                {label}
                {href === "/shop" && (
                  <span className={cn(
                    "ml-auto text-[10px] font-black px-1.5 py-0.5 rounded-full",
                    active ? "bg-white/20 text-white" : "bg-accent/20 text-primary"
                  )}>
                    NEW
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Юзер + выход */}
        {user && (
          <div className="px-3 py-4 border-t border-gray-100">
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50 mb-2 relative">
              <AvatarDisplay avatarId={user.avatarId} size="sm" frameId={user.frameId} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text truncate">{user.name}</p>
                <p className="text-[11px] text-text-muted">{level.label}</p>
              </div>
              <NotificationBell variant="sidebar" />
            </div>
            <button
              onClick={() => setConfirmLogout(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-text-muted hover:bg-gray-50 hover:text-text transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M7 3H4a1 1 0 00-1 1v12a1 1 0 001 1h3M13 15l4-5-4-5M17 10H7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Выйти
            </button>
          </div>
        )}
      </aside>

      <ConfirmDialog
        open={confirmLogout}
        title="Выйти из аккаунта?"
        description="Твой прогресс сохранён и никуда не денется."
        confirmLabel="Выйти"
        onConfirm={logout}
        onCancel={() => setConfirmLogout(false)}
      />
    </>
  );
});
