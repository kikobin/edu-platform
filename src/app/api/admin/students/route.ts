import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const auth = await requireAuth("curator");
  if (auth instanceof NextResponse) return auth;

  let studentIds: string[] | undefined;
  if (auth.role === "curator") {
    const assignedIds = await supabase.getCuratorStudents(auth.appUserId);
    if (assignedIds.length > 0) studentIds = assignedIds;
  }

  const profiles = await supabase.getStudentProfiles(studentIds);

  const students = profiles.map((p) => ({
    id:       p.app_user_id,
    name:     p.name,
    avatarId: p.avatar_id,
    xp:       p.xp,
  }));

  return NextResponse.json(students);
}
