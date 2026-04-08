"use client";

import { useUserStore } from "@/store/userStore";
import { AvatarDisplay } from "@/components/profile/AvatarDisplay";
import { PageContainer } from "@/components/layout/PageContainer";
import { DashboardGrid } from "@/components/layout/DashboardGrid";
import { cn } from "@/lib/utils";
import type { AvatarId } from "@/types";

export type PeerEntry = { userId: string; name: string; avatarId: AvatarId; xp: number };
type BoardEntry = PeerEntry & { rank: number };

const PODIUM_IDX    = [1, 0, 2] as const;
const PODIUM_HEIGHT = ["h-16", "h-24", "h-12"] as const;
const PODIUM_AVATAR = ["md", "lg", "md"] as const;

const RANK_BADGE: Record<number, string> = {
  1: "bg-yellow-400 text-white",
  2: "bg-gray-300 text-gray-700",
  3: "bg-amber-600 text-white",
};
const RANK_LABEL: Record<number, string> = {
  1: "Лидер курса",
  2: "Серебряный призёр",
  3: "Бронзовый призёр",
};

interface Props {
  /** Server-fetched leaderboard entries; current user is injected client-side */
  peers: PeerEntry[];
}

export function LeaderboardClient({ peers }: Props) {
  const user = useUserStore((s) => s.user);
  const xp   = useUserStore((s) => s.xp);

  const myId = user?.id ?? "me";

  const board: BoardEntry[] = [
    ...peers.filter((e) => e.userId !== myId),
    { userId: myId, name: user?.name ?? "Ты", avatarId: (user?.avatarId ?? "avatar_4") as AvatarId, xp },
  ]
    .sort((a, b) => b.xp - a.xp)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  const myEntry    = board.find((e) => e.userId === myId)!;
  const myRank     = myEntry?.rank ?? 0;
  const total      = board.length;
  const percentile = total > 1 ? Math.round(((total - myRank) / (total - 1)) * 100) : 100;
  const nextEntry  = myRank > 1 ? board[myRank - 2] : null;
  const prevEntry  = board[myRank] ?? null;
  const xpToNext   = nextEntry ? nextEntry.xp - xp : 0;
  const xpLead     = prevEntry ? xp - prevEntry.xp : 0;
  const avgXp      = Math.round(board.reduce((s, e) => s + e.xp, 0) / board.length);
  const podium     = PODIUM_IDX.map((i) => board[i] as BoardEntry | undefined);

  return (
    <PageContainer>

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-text tracking-tight leading-none">Рейтинг</h1>
          <p className="text-text-muted mt-2">
            Лучшие ученики курса&ensp;·&ensp;
            <span className="font-semibold text-text">{total} участников</span>
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          {myEntry && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-light border border-primary/20">
              <span className="text-primary font-black text-sm">#{myRank}</span>
              <span className="text-text-muted text-sm">твоё место</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-dark px-4 py-2.5 rounded-xl">
            <span className="text-accent">⚡</span>
            <span className="font-black text-white text-sm">{xp} XP</span>
          </div>
        </div>
      </div>

      {/* ── Main two-column section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* ══ Left: Premium Top 3 Card ══ */}
        <div
          className="lg:col-span-2 rounded-3xl p-6 flex flex-col min-h-[480px]"
          style={{ background: "linear-gradient(145deg, #1A1A2E 0%, #2D2B5E 60%, #1E2A4A 100%)" }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-white font-black text-xl leading-none">Топ 3</p>
              <p className="text-white/40 text-xs mt-1.5">Лидеры курса</p>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-2xl">🏆</div>
          </div>

          <div className="flex items-end justify-center gap-2 flex-1 mb-6">
            {podium.map((entry, i) => {
              if (!entry) return <div key={i} className="flex-1" />;
              const isCenter = i === 1;
              const isMe     = entry.userId === myId;
              return (
                <div key={entry.userId} className="flex-1 flex flex-col items-center">
                  {isCenter && (
                    <div className="mb-2 w-9 h-9 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/40">
                      <span className="text-base">👑</span>
                    </div>
                  )}
                  <div className={cn(
                    "rounded-2xl p-0.5",
                    isMe ? "bg-gradient-to-br from-[#B5ED18] to-yellow-300 shadow-lg" : "bg-transparent"
                  )}>
                    <AvatarDisplay avatarId={entry.avatarId} size={PODIUM_AVATAR[i]} />
                  </div>
                  <p className={cn(
                    "font-bold text-center mt-2 w-full px-1 truncate",
                    isCenter ? "text-white text-sm" : "text-white/70 text-xs"
                  )}>
                    {isMe ? (user?.name?.split(" ")[0] ?? "Ты") : entry.name.split(" ")[0]}
                    {isMe && <span className="ml-1 text-accent">★</span>}
                  </p>
                  <p className={cn("font-black text-2xs mb-2.5", isCenter ? "text-accent" : "text-white/40")}>
                    {entry.xp} XP
                  </p>
                  <div className={cn(
                    "w-full rounded-t-xl flex items-start justify-center pt-2 font-black text-sm",
                    PODIUM_HEIGHT[i],
                    i === 1 ? "bg-white/20 text-white"
                    : i === 0 ? "bg-white/12 text-white/60"
                    : "bg-white/8 text-white/40"
                  )}>
                    {entry.rank}
                  </div>
                </div>
              );
            })}
          </div>

          {myEntry && (
            <div className={cn(
              "rounded-2xl px-4 py-3.5 flex items-center gap-3 border",
              myEntry.rank <= 3 ? "bg-accent/15 border-accent/30" : "bg-white/8 border-white/10"
            )}>
              {myEntry.rank <= 3 ? (
                <>
                  <span className="text-lg">🏅</span>
                  <p className="text-white font-bold text-sm flex-1">Ты в топ 3!</p>
                  <span className="text-accent font-black text-sm">#{myEntry.rank} место</span>
                </>
              ) : (
                <>
                  <span className="text-accent font-black text-sm w-8 shrink-0">#{myEntry.rank}</span>
                  <AvatarDisplay avatarId={myEntry.avatarId} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm leading-none truncate">Твоя позиция</p>
                    <p className="text-white/40 text-2xs mt-1">Продолжай в том же духе!</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-accent text-xs">⚡</span>
                    <span className="text-white font-black text-sm">{myEntry.xp}</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ══ Right: Full leaderboard list ══ */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-border shadow-card flex flex-col overflow-hidden">
          <div className="px-5 pt-5 pb-4 border-b border-border flex items-center justify-between shrink-0">
            <div>
              <p className="font-black text-text">Таблица рейтинга</p>
              <p className="text-xs text-text-muted mt-0.5">Все {total} участника</p>
            </div>
            <span className="text-xs text-text-muted bg-gray-50 border border-border px-3 py-1.5 rounded-xl">
              📅 За всё время
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border">
            {board.map((entry) => {
              const isMe   = entry.userId === myId;
              const isTop3 = entry.rank <= 3;
              const maxXp  = board[0]?.xp ?? 1;
              return (
                <div
                  key={entry.userId}
                  className={cn(
                    "flex items-center gap-3.5 px-5 py-3.5 transition-colors",
                    isMe ? "bg-primary-light" : "hover:bg-gray-50/60"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0",
                    isTop3 ? RANK_BADGE[entry.rank]
                    : isMe  ? "bg-primary text-white"
                    : "bg-gray-100 text-text-muted"
                  )}>
                    {entry.rank}
                  </div>
                  <AvatarDisplay avatarId={entry.avatarId} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className={cn("font-semibold text-sm truncate", isMe ? "text-primary font-bold" : "text-text")}>
                        {isMe ? (user?.name ?? entry.name) : entry.name}
                      </p>
                      {isMe && (
                        <span className="shrink-0 text-2xs font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-md leading-tight">
                          ты
                        </span>
                      )}
                    </div>
                    {isTop3 && <p className="text-2xs text-text-muted mt-0.5">{RANK_LABEL[entry.rank]}</p>}
                  </div>
                  <div className="hidden md:flex items-center w-28 shrink-0">
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", isMe ? "bg-primary" : isTop3 ? "bg-primary/40" : "bg-gray-300")}
                        style={{ width: `${Math.round((entry.xp / maxXp) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-black shrink-0",
                    isMe ? "bg-primary text-white" : "bg-gray-50 text-text border border-border"
                  )}>
                    <span className={cn("text-xs", isMe ? "text-accent" : "text-text-muted")}>⚡</span>
                    {entry.xp}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Supporting stats row ── */}
      <DashboardGrid cols="3md" gap="sm">
        <div className="bg-white rounded-2xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-text text-sm">До следующей позиции</p>
            <span className="text-xl">🎯</span>
          </div>
          {nextEntry ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <AvatarDisplay avatarId={nextEntry.avatarId} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text truncate">{nextEntry.name.split(" ")[0]}</p>
                  <p className="text-2xs text-text-muted">#{nextEntry.rank} место</p>
                </div>
                <span className="text-primary font-black text-sm shrink-0">+{xpToNext} XP</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-[#8B7FE8] rounded-full"
                  style={{ width: `${Math.max(6, Math.round((xp / nextEntry.xp) * 100))}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-2xs text-text-muted">{xp} XP</span>
                <span className="text-2xs text-text-muted">{nextEntry.xp} XP</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <span className="text-4xl mb-2">🥇</span>
              <p className="font-bold text-text text-sm">Ты первый!</p>
              <p className="text-2xs text-text-muted mt-1">Удерживай лидерство</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-text text-sm">Твоя позиция</p>
            <span className="text-xl">📊</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-primary-light rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-primary leading-none">#{myRank}</p>
              <p className="text-2xs text-text-muted mt-1">место в классе</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center border border-border">
              <p className="text-2xl font-black text-text leading-none">{percentile}%</p>
              <p className="text-2xs text-text-muted mt-1">лучше других</p>
            </div>
          </div>
          {xpLead > 0 && prevEntry && (
            <p className="text-xs text-text-muted text-center">
              Опережаешь следующего на <span className="font-bold text-primary">{xpLead} XP</span>
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-text text-sm">Статистика класса</p>
            <span className="text-xl">🎓</span>
          </div>
          <div className="space-y-3">
            {[
              { label: "Участников",  value: total,                    accent: "text-text"       },
              { label: "Средний XP",  value: `${avgXp} XP`,            accent: "text-primary"    },
              { label: "Лидер",       value: `${board[0]?.xp ?? 0} XP`, accent: "text-yellow-500" },
              { label: "Мой XP",      value: `${xp} XP`,               accent: "text-primary"    },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center justify-between">
                <span className="text-sm text-text-muted">{stat.label}</span>
                <span className={cn("font-bold text-sm", stat.accent)}>{stat.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-green-400"
                  style={{ width: `${percentile}%` }}
                />
              </div>
              <span className="text-2xs text-text-muted shrink-0">топ {100 - percentile}%</span>
            </div>
          </div>
        </div>
      </DashboardGrid>

      {/* ── Bottom motivation banner ── */}
      <div
        className="rounded-3xl p-6 md:p-8 flex items-center justify-between gap-6"
        style={{ background: "linear-gradient(135deg, #1A1A2E 0%, #2D2B5E 60%, #1E2A4A 100%)" }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-white font-black text-xl leading-tight">Как подняться выше?</p>
          <p className="text-white/50 text-sm mt-1.5 leading-relaxed">
            Проходи уроки и выполняй задания — каждое занятие приносит XP и двигает тебя вверх
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-5">
            {[
              { icon: "📖", label: "Урок",       xp: "+10–30 XP"  },
              { icon: "✅", label: "Задание",     xp: "+5–15 XP"   },
              { icon: "🔥", label: "Серия дней", xp: "+5 XP/день" },
              { icon: "🏅", label: "Достижение", xp: "+20–50 XP"  },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2.5 bg-white/10 rounded-xl px-3.5 py-2.5 border border-white/8"
              >
                <span className="text-base">{item.icon}</span>
                <div>
                  <p className="text-white/80 text-2xs font-semibold leading-none">{item.label}</p>
                  <p className="text-accent text-2xs font-black mt-0.5">{item.xp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="hidden lg:block text-7xl opacity-15 select-none shrink-0">🚀</div>
      </div>

    </PageContainer>
  );
}
