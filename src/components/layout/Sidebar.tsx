"use client";

import { memo, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { AvatarDisplay } from "@/components/profile/AvatarDisplay";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Logo } from "@/components/brand/Logo";
import { LogoutIcon } from "@/components/brand/Icon";
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
    href: "/my-homework",
    label: "Домашки",
    studentOnly: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
        <path d="M5 3H13L17 7V17C17 17.55 16.55 18 16 18H5C4.45 18 4 17.55 4 17V4C4 3.45 4.45 3 5 3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M13 3V7H17" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
        <path d="M7 11H14M7 14H12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
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
      <aside className="hidden md:flex flex-col w-60 min-h-screen bg-white border-r border-border fixed left-0 top-0 z-40">
        <div className="px-5 pt-6 pb-5">
          <Logo withTagline />
        </div>

        <nav className="flex-1 px-3 flex flex-col gap-0.5">
          {navItems.map(({ href, label, icon, studentOnly }) => {
            if (studentOnly && user?.role && user.role !== "student") return null;
            const active =
              pathname === href ||
              (pathname.startsWith("/study") && href === "/dashboard") ||
              (pathname.startsWith("/modules") && href === "/dashboard");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-colors",
                  active
                    ? "bg-primary text-white"
                    : "text-text-muted hover:bg-bg hover:text-text"
                )}
              >
                <span>{icon}</span>
                {label}
                {href === "/shop" && (
                  <span className={cn(
                    "ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded",
                    active ? "bg-white/20 text-white" : "bg-accent/30 text-text"
                  )}>
                    NEW
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {user && (
          <div className="px-3 py-4 border-t border-border">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-bg mb-2 relative">
              <AvatarDisplay avatarId={user.avatarId} size="sm" frameId={user.frameId} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-text truncate">{user.name}</p>
                <p className="text-[11px] text-text-muted">{level.label}</p>
              </div>
              <NotificationBell variant="sidebar" />
            </div>
            <button
              onClick={() => setConfirmLogout(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium text-text-muted hover:bg-bg hover:text-text transition-colors"
            >
              <LogoutIcon size={16} />
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
