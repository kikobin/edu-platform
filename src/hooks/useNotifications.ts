"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";

export interface AppNotification {
  id: string;
  type: string;
  message: string;
  lessonId?: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationsState {
  notifications: AppNotification[];
  unreadCount: number;
  hasFetched: boolean;
  markAllRead: () => void;
  refetch: () => void;
}

const POLL_INTERVAL = 30_000; // 30s

export function useNotifications(): NotificationsState {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data: AppNotification[] = await res.json();
      setNotifications((prev) => {
        // Skip re-render when data is identical
        if (
          prev.length === data.length &&
          prev.every((n, i) => n.id === data[i]?.id && n.read === data[i]?.read)
        ) {
          return prev;
        }
        return data;
      });
      setHasFetched(true);
    } catch {
      // silent — notifications are non-critical
    }
  }, []);

  const markAllRead = useCallback(async () => {
    // Capture watermark before optimistic update so we only mark notifications
    // that were visible when the user opened the panel (not ones that arrive later).
    const before = notifications.find((n) => !n.read)?.createdAt
      ?? new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ before }),
      });
    } catch {
      // silent
    }
  }, [notifications]);

  useEffect(() => {
    fetchNotifications();

    const schedule = () => {
      timerRef.current = setTimeout(() => {
        fetchNotifications();
        schedule();
      }, POLL_INTERVAL);
    };
    schedule();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fetchNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  return { notifications, unreadCount, hasFetched, markAllRead, refetch: fetchNotifications };
}
