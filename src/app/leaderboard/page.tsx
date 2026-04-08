import { AppLayout } from "@/components/layout/AppLayout";
import { PageTransition } from "@/components/layout/PageTransition";
import { supabase, supabaseEnabled } from "@/lib/supabase";
import { LeaderboardClient, type PeerEntry } from "./LeaderboardClient";
import type { AvatarId } from "@/types";

export const revalidate = 60; // refresh leaderboard at most once per minute

async function fetchPeers(): Promise<PeerEntry[]> {
  if (!supabaseEnabled) return [];
  const rows = await supabase.getLeaderboard();
  return rows.map((r) => ({
    userId: r.user_id,
    name: r.name,
    avatarId: r.avatar_id as AvatarId,
    xp: r.xp,
  }));
}

export default async function LeaderboardPage() {
  const peers = await fetchPeers();

  return (
    <AppLayout wide>
      <PageTransition>
        <LeaderboardClient peers={peers} />
      </PageTransition>
    </AppLayout>
  );
}
