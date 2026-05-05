import { create } from "zustand";
import { storage } from "@/lib/storage";
import type { User, AvatarId } from "@/types";
import { XP_REWARDS } from "@/types";

let _xpTimer:    ReturnType<typeof setTimeout> | null = null;
let _toastTimer: ReturnType<typeof setTimeout> | null = null;

interface XPPopupState {
  visible: boolean;
  amount: number;
}

interface ToastState {
  visible: boolean;
  title: string;
  description?: string;
}

interface UserState {
  user: User | null;
  xp: number;
  streak: number;
  purchasedIds: string[];
  xpPopup: XPPopupState;
  toast: ToastState;

  login: (user: User) => void;
  logout: () => void;
  updateAvatar: (avatarId: AvatarId) => void;
  equipTitle: (titleId: string | undefined) => void;
  equipFrame: (frameId: string | undefined) => void;
  /**
   * Award XP.
   * Pass a `sourceId` to make the award idempotent — the same sourceId can
   * only be awarded once per session/device. Use format "step:{lessonId}:{stepId}".
   * Omit sourceId for transient rewards (streak bonuses, purchases refunds, etc.)
   * that don't need deduplication.
   */
  addXP: (amount: number, sourceId?: string) => void;
  spendXP: (amount: number) => boolean;
  purchase: (itemId: string, cost: number) => boolean;
  showXPPopup: (amount: number) => void;
  hideXPPopup: () => void;
  showToast: (title: string, description?: string) => void;
  hideToast: () => void;
  resetDemo: () => void;
  clearCourseState: (opts?: { avatarId?: AvatarId; clearCosmetics?: boolean }) => void;
  initFromStorage: () => void;
  /**
   * Forward-only XP reconciliation with server.
   * If the server has more XP than localStorage, update local state.
   * Never reduces XP (guards against stale server data).
   */
  reconcileXP: (serverXP: number) => void;
  /**
   * Merge server-side purchased IDs into local state.
   * Adds any IDs present on server but missing locally (forward-only).
   */
  reconcilePurchases: (serverIds: string[]) => void;
  /** Sync streak from server — takes the higher value. */
  reconcileStreak: (serverStreak: number) => void;
}


export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  xp: 0,
  streak: 3,
  purchasedIds: [],
  xpPopup: { visible: false, amount: 0 },
  toast: { visible: false, title: "" },

  login: (user) => {
    storage.set("user", user);

    const xp        = storage.get<number>(`xp_${user.id}`) ?? 0;
    const purchased = storage.get<string[]>(`purchasedIds_${user.id}`) ?? [];

    // Streak: считаем по дате последнего входа
    const today        = new Date().toISOString().slice(0, 10);
    const lastVisit    = storage.get<string>(`lastVisit_${user.id}`);
    const prevStreak   = storage.get<number>(`streak_${user.id}`) ?? 0;
    let streak = prevStreak;

    if (lastVisit === null) {
      streak = 1;
    } else if (lastVisit === today) {
      // уже входили сегодня — streak не меняем
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const wasYesterday = lastVisit === yesterday.toISOString().slice(0, 10);
      streak = wasYesterday ? prevStreak + 1 : 1;
    }

    storage.set(`lastVisit_${user.id}`, today);
    storage.set(`streak_${user.id}`, streak);

    set({ user, xp, streak, purchasedIds: purchased });
  },

  logout: () => {
    storage.remove("user");
    set({ user: null, xp: 0, streak: 0, purchasedIds: [] });
    // Clear Sentry user context on logout — dynamic import avoids bundle impact
    import("@sentry/nextjs").then((S) => S.setUser(null)).catch(() => {});
    fetch("/api/auth/logout", { method: "POST" })
      .catch(() => { /* logout is best-effort; we still redirect */ })
      .finally(() => {
        window.location.href = "/login";
      });
  },

  updateAvatar: (avatarId) => {
    const user = get().user;
    if (!user) return;
    const updated = { ...user, avatarId };
    storage.set("user", updated);
    set({ user: updated });
    fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarId }),
    }).catch(() => {});
  },

  equipTitle: (titleId) => {
    const user = get().user;
    if (!user) return;
    const updated = { ...user, titleId };
    storage.set("user", updated);
    set({ user: updated });
    fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titleId: titleId ?? null }),
    }).catch(() => {});
  },

  equipFrame: (frameId) => {
    const user = get().user;
    if (!user) return;
    const updated = { ...user, frameId };
    storage.set("user", updated);
    set({ user: updated });
    fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frameId: frameId ?? null }),
    }).catch(() => {});
  },

  addXP: (amount, sourceId) => {
    const { user } = get();

    // ── Local idempotency — instant feedback, no network wait ─────────────────
    if (sourceId && user) {
      const ledger = storage.get<string[]>(`xp_ledger_${user.id}`) ?? [];
      if (ledger.includes(sourceId)) return; // already awarded — skip silently
      storage.set(`xp_ledger_${user.id}`, [...ledger, sourceId]);
    }

    const newXP = get().xp + amount;
    if (user) storage.set(`xp_${user.id}`, newXP);
    set({ xp: newXP });
    get().showXPPopup(amount);

    // ── Persist to server asynchronously — DB-level idempotency via UNIQUE ────
    if (sourceId) {
      fetch("/api/xp/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId, amount }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { total: number } | null) => {
          if (data?.total) useUserStore.getState().reconcileXP(data.total);
        })
        .catch(() => {});
    }
  },

  spendXP: (amount) => {
    const uid = get().user?.id;
    const current = get().xp;
    if (current < amount) return false;
    const newXP = current - amount;
    if (uid) storage.set(`xp_${uid}`, newXP);
    set({ xp: newXP });
    return true;
  },

  purchase: (itemId, cost) => {
    const uid = get().user?.id;
    const already = get().purchasedIds.includes(itemId);
    if (already) return false;
    const ok = get().spendXP(cost);
    if (!ok) return false;
    const updated = [...get().purchasedIds, itemId];
    if (uid) storage.set(`purchasedIds_${uid}`, updated);
    set({ purchasedIds: updated });
    return true;
  },

  showXPPopup: (amount) => {
    if (_xpTimer) clearTimeout(_xpTimer);
    set({ xpPopup: { visible: true, amount } });
    _xpTimer = setTimeout(() => { get().hideXPPopup(); _xpTimer = null; }, 2200);
  },

  hideXPPopup: () => set({ xpPopup: { visible: false, amount: 0 } }),

  showToast: (title, description) => {
    if (_toastTimer) clearTimeout(_toastTimer);
    set({ toast: { visible: true, title, description } });
    _toastTimer = setTimeout(() => {
      get().hideToast();
      _toastTimer = null;
    }, 2600);
  },

  hideToast: () => set({ toast: { visible: false, title: "", description: undefined } }),

  resetDemo: () => {
    const user = get().user;
    if (!user) return;
    const xp = 320;
    const streak = 3;
    const purchasedIds: string[] = [];
    storage.set(`xp_${user.id}`, xp);
    storage.set(`streak_${user.id}`, streak);
    storage.set(`purchasedIds_${user.id}`, purchasedIds);
    // Clear the XP ledger so demo resets allow re-earning all step rewards
    storage.set(`xp_ledger_${user.id}`, []);
    set({ xp, streak, purchasedIds });
  },

  clearCourseState: (opts) => {
    const user = get().user;
    if (!user) return;

    const updatedUser = opts?.clearCosmetics
      ? {
          ...user,
          avatarId: opts.avatarId ?? user.avatarId,
          titleId: undefined,
          frameId: undefined,
        }
      : user;

    storage.set("user", updatedUser);
    storage.set(`xp_${user.id}`, 0);
    storage.set(`purchasedIds_${user.id}`, []);
    storage.set(`xp_ledger_${user.id}`, []);

    set({
      user: updatedUser,
      xp: 0,
      purchasedIds: [],
    });
  },

  initFromStorage: () => {
    const savedUser = storage.get<User>("user");
    if (!savedUser) return;

    const uid = savedUser.id;
    const savedXP           = storage.get<number>(`xp_${uid}`);
    const savedStreak       = storage.get<number>(`streak_${uid}`);
    const savedPurchasedIds = storage.get<string[]>(`purchasedIds_${uid}`);

    const xp           = typeof savedXP === "number" && Number.isFinite(savedXP) ? Math.max(0, savedXP) : 0;
    const streak       = typeof savedStreak === "number" && Number.isFinite(savedStreak) ? Math.max(0, savedStreak) : 0;
    const purchasedIds = Array.isArray(savedPurchasedIds) ? savedPurchasedIds : [];

    set({ user: savedUser, xp, streak, purchasedIds });
  },

  reconcileXP: (serverXP) => {
    const { user, xp } = get();
    if (serverXP <= xp) return;
    storage.set(`xp_${user?.id}`, serverXP);
    set({ xp: serverXP });
  },

  reconcilePurchases: (serverIds) => {
    const { user, purchasedIds } = get();
    const seen = new Set(purchasedIds);
    const added = serverIds.filter((id) => !seen.has(id));
    const merged = added.length > 0 ? [...purchasedIds, ...added] : purchasedIds;
    if (added.length === 0) return;
    if (user?.id) storage.set(`purchasedIds_${user.id}`, merged);
    set({ purchasedIds: merged });
  },

  reconcileStreak: (serverStreak) => {
    const { user, streak } = get();
    if (serverStreak <= streak) return;
    if (user?.id) storage.set(`streak_${user.id}`, serverStreak);
    set({ streak: serverStreak });
  },
}));

export { XP_REWARDS };
