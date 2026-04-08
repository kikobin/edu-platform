import type { LeaderboardEntry } from "@/types";

// Fallback-данные — используются только если Supabase недоступен.
// При работающей БД данные берутся из таблицы user_progress.
export const PEER_ENTRIES: Omit<LeaderboardEntry, "rank">[] = [
  { userId: "student-1", name: "Даниал Есімжан",   avatarId: "avatar_1", xp: 0 },
  { userId: "student-2", name: "Бегарыс Ескендір", avatarId: "avatar_2", xp: 0 },
  { userId: "student-3", name: "Найля Бисенова",   avatarId: "avatar_3", xp: 0 },
  { userId: "student-4", name: "Бекнур Нурмухан",  avatarId: "avatar_4", xp: 0 },
  { userId: "student-5", name: "Дильназ Баратова", avatarId: "avatar_5", xp: 0 },
];
