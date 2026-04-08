"use client";

import { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/dashboard",
    label: "Главная",
    icon: (a: boolean) => (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
        <path d="M2 10L10 2L18 10V18H13V13H7V18H2V10Z"
          stroke={a ? "#685BC7" : "#9CA3AF"} strokeWidth="1.8" strokeLinejoin="round"
          fill={a ? "#685BC7" : "none"} fillOpacity={a ? 0.12 : 0}/>
      </svg>
    ),
  },
  {
    href: "/shop",
    label: "Магазин",
    icon: (a: boolean) => (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
        <path d="M2 3H4.5L6.5 13H15.5L17.5 6H5.5"
          stroke={a ? "#685BC7" : "#9CA3AF"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="8" cy="16.5" r="1" fill={a ? "#685BC7" : "#9CA3AF"}/>
        <circle cx="14" cy="16.5" r="1" fill={a ? "#685BC7" : "#9CA3AF"}/>
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Профиль",
    icon: (a: boolean) => (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="7" r="3.5" stroke={a ? "#685BC7" : "#9CA3AF"} strokeWidth="1.8"
          fill={a ? "#685BC7" : "none"} fillOpacity={a ? 0.12 : 0}/>
        <path d="M3 17C3 14.2 6.13 12 10 12C13.87 12 17 14.2 17 17"
          stroke={a ? "#685BC7" : "#9CA3AF"} strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/leaderboard",
    label: "Рейтинг",
    icon: (a: boolean) => (
      <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
        <path d="M10 2L12.09 7.5H18L13.45 10.97L15.18 16.5L10 13.27L4.82 16.5L6.55 10.97L2 7.5H7.91L10 2Z"
          stroke={a ? "#685BC7" : "#9CA3AF"} strokeWidth="1.8" strokeLinejoin="round"
          fill={a ? "#685BC7" : "none"} fillOpacity={a ? 0.12 : 0}/>
      </svg>
    ),
  },
];

export const BottomNav = memo(function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-gray-100">
      <div className="flex">
        {navItems.map(({ href, label, icon }) => {
          const active =
            pathname === href ||
            (pathname.startsWith("/lesson") && href === "/dashboard");
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 min-h-[58px] relative"
            >
              {href === "/shop" && !active && (
                <span className="absolute top-1.5 right-[calc(50%-18px)] w-1.5 h-1.5 bg-accent rounded-full" />
              )}
              {icon(active)}
              <span className={cn(
                "text-[10px] font-bold",
                active ? "text-primary" : "text-gray-400"
              )}>
                {label}
              </span>
            </Link>
          );
        })}
        {/* Колокольчик уведомлений */}
        <div className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 min-h-[58px]">
          <NotificationBell variant="bottomnav" />
          <span className="text-[10px] font-bold text-gray-400">Уведомления</span>
        </div>
      </div>
    </nav>
  );
});
