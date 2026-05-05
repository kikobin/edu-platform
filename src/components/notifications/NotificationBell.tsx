"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import Link from "next/link";
import { useNotificationsContext } from "@/context/NotificationsContext";
import { CheckIcon, PencilIcon, InfoIcon } from "@/components/brand/Icon";
import { cn } from "@/lib/utils";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return "только что";
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  return `${Math.floor(h / 24)} дн назад`;
}

const TYPE_ICON: Record<string, ReactNode> = {
  homework_approved: <CheckIcon size={16} className="text-success" />,
  homework_revision: <PencilIcon size={16} className="text-error" />,
};

interface Props {
  /** compact = иконка в сайдбар; full = отдельная страница (не используется сейчас) */
  variant?: "sidebar" | "bottomnav";
}

export function NotificationBell({ variant = "sidebar" }: Props) {
  const { notifications, unreadCount, hasFetched, markAllRead } = useNotificationsContext();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = () => {
    setOpen((prev) => {
      if (!prev && unreadCount > 0) markAllRead();
      return !prev;
    });
  };

  const iconSize = variant === "bottomnav" ? 22 : 18;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        aria-label="Уведомления"
        className={cn(
          "relative flex items-center justify-center rounded-md transition-colors",
          variant === "sidebar"
            ? "w-8 h-8 text-text-muted hover:bg-bg hover:text-text"
            : "w-11 h-11 text-text-muted"
        )}
      >
        <svg width={iconSize} height={iconSize} viewBox="0 0 20 20" fill="none">
          <path
            d="M10 2a6 6 0 00-6 6v3l-1.5 2.5h15L16 11V8a6 6 0 00-6-6z"
            stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"
          />
          <path
            d="M8.5 16.5a1.5 1.5 0 003 0"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
          />
        </svg>

        {/* Unread badge */}
        {hasFetched && unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-red-500 text-white text-[9px] font-black rounded-full leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className={cn(
          "absolute z-50 bg-white rounded-xl shadow-xl border border-border w-80 overflow-y-auto",
          variant === "sidebar"
            ? "left-full ml-2 top-0 max-h-96"
            : "bottom-full mb-2 right-0 max-h-[min(384px,calc(100dvh-80px))]"
        )}>
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <p className="text-[14px] font-semibold text-text">Уведомления</p>
            {notifications.length > 0 && (
              <span className="text-[11px] text-text-muted">{notifications.length}</span>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-bg text-text-muted mb-2">
                <InfoIcon size={18} />
              </div>
              <p className="text-[13px] text-text-muted">Нет уведомлений</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n) => {
                const href =
                  n.lessonId && (n.type === "homework_revision" || n.type === "homework_approved")
                    ? `/study/${n.lessonId}`
                    : null;
                const inner = (
                  <>
                    <span className="shrink-0 mt-0.5">
                      {TYPE_ICON[n.type] ?? <InfoIcon size={16} className="text-text-muted" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] text-text leading-snug">{n.message}</p>
                      <p className="text-[11px] text-text-muted mt-0.5">{timeAgo(n.createdAt)}</p>
                      {href && (
                        <p className="text-[11px] text-primary font-semibold mt-1">
                          Перейти к работе →
                        </p>
                      )}
                    </div>
                    {!n.read && (
                      <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />
                    )}
                  </>
                );

                if (href) {
                  return (
                    <li key={n.id} className={cn(!n.read && "bg-primary/5")}>
                      <Link
                        href={href}
                        onClick={() => setOpen(false)}
                        className="flex gap-3 px-4 py-3 hover:bg-bg transition-colors"
                      >
                        {inner}
                      </Link>
                    </li>
                  );
                }
                return (
                  <li key={n.id} className={cn("px-4 py-3 flex gap-3", !n.read && "bg-primary/5")}>
                    {inner}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
