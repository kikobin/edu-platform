/**
 * Сервис лидерборда.
 *
 * Сейчас: статические "одноклассники" + реальный XP текущего пользователя.
 * Когда появится бэкенд: GET /api/leaderboard → реальные данные всех пользователей.
 */

import type { LeaderboardEntry, AvatarId } from "@/types";
import { PEER_ENTRIES } from "@/data/leaderboard";

export interface LeaderboardUser {
  userId: string;
  name: string;
  avatarId: AvatarId;
  xp: number;
}

export async function getLeaderboard(currentUser: LeaderboardUser): Promise<LeaderboardEntry[]> {
  const all = [
    ...PEER_ENTRIES,
    { ...currentUser },
  ];

  return all
    .sort((a, b) => b.xp - a.xp)
    .map((e, i) => ({ ...e, rank: i + 1 }));
}
