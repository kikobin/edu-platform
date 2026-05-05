import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireAuth } from "@/lib/auth/requireAuth";
import { supabase } from "@/lib/supabase";

function csvEscape(v: unknown): string {
  const s = v == null ? "" : String(v);
  // Escape quotes by doubling and wrap if contains separator/quote/newline.
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET() {
  const auth = await requireAuth("curator");
  if (auth instanceof NextResponse) return auth;

  try {
    let studentIds: string[] | undefined;
    if (auth.role === "curator") {
      const assigned = await supabase.getCuratorStudents(auth.appUserId);
      if (assigned.length === 0) {
        return new NextResponse("name,xp\n", {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="students.csv"`,
          },
        });
      }
      studentIds = assigned;
    }

    // Walk every page so a curator with 500 students gets the full CSV, not
    // just the first 200 by XP. Bound the loop hard so a runaway DB can't make
    // the route hang.
    const PAGE = 200;
    const MAX_PAGES = 100; // 20k students is plenty for any school
    const all: Awaited<ReturnType<typeof supabase.getStudentProfiles>>["rows"] = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
      const { rows, total } = await supabase.getStudentProfiles({
        studentIds, pageSize: PAGE, page,
      });
      all.push(...rows);
      if (rows.length < PAGE || all.length >= total) break;
    }

    const lines = ["name,app_user_id,xp"];
    for (const r of all) {
      lines.push([csvEscape(r.name), csvEscape(r.app_user_id), csvEscape(r.xp)].join(","));
    }
    // BOM helps Excel render UTF-8 (Cyrillic) correctly.
    const body = "﻿" + lines.join("\n") + "\n";

    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="students-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "GET /api/admin/students/export" } });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
