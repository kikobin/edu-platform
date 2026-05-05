"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import type { User } from "@/types";

/**
 * Verifies the Supabase session is still valid on app mount.
 *
 * Flow:
 * 1. Reads local user from Zustand (instant render — no flicker)
 * 2. Calls GET /api/me to validate the JWT server-side
 * 3. If valid: syncs fresh profile data (xp, titleId, frameId) into the store
 * 4. If 401: session expired — calls logout() and redirects to /login
 *
 * Must be called once per authenticated layout (AppLayout).
 */
export function useSession() {
  const router  = useRouter();
  const login   = useUserStore((s) => s.login);
  const logout  = useUserStore((s) => s.logout);
  const user    = useUserStore((s) => s.user);
  const checked = useRef(false);

  useEffect(() => {
    // Only run once per mount
    if (checked.current) return;
    checked.current = true;

    const tzOffset = new Date().getTimezoneOffset();
    fetch(`/api/me?tzOffset=${tzOffset}`)
      .then(async (res) => {
        if (res.status === 401) {
          // Session expired or cookie gone — clear local state and redirect
          logout();
          router.replace("/login");
          return;
        }
        if (!res.ok) return; // Server error — don't logout, keep local state

        const fresh: User & { xp?: number; streak?: number } = await res.json();

        // Sync fresh data from server into the store (role, xp, title, frame)
        // login() also recomputes streak and loads localStorage state
        login(fresh);

        // Sync xp from server if higher than local
        if (typeof fresh.xp === "number") {
          useUserStore.getState().reconcileXP(fresh.xp);
        }

        // Sync streak from server (authoritative — multi-device safe)
        if (typeof fresh.streak === "number") {
          useUserStore.getState().reconcileStreak(fresh.streak);
        }

        // Set Sentry user context for error attribution (dynamic import avoids OTel warning)
        import("@sentry/nextjs").then((S) => S.setUser({ id: fresh.id, username: fresh.name })).catch(() => {});
      })
      .catch(() => {
        // Network error — keep whatever is in localStorage, don't redirect
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { user };
}
