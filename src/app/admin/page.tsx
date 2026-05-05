import Link from "next/link";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth/requireAuth";
import { NextResponse } from "next/server";
import type { SubmissionStatus } from "@/types";

export const dynamic = "force-dynamic";

interface Student { id: string; name: string; xp: number }
interface SubRow {
  id: string;
  userName: string;
  lessonTitle: string;
  status: SubmissionStatus;
  submittedAt: string;
}

const STATUS_STYLE: Record<SubmissionStatus, string> = {
  pending:  "bg-amber-50 text-amber-600 border-amber-200",
  approved: "bg-green-50 text-green-600 border-green-200",
  revision: "bg-red-50 text-red-600 border-red-200",
};
const STATUS_LABEL: Record<SubmissionStatus, string> = {
  pending: "Ожидает", approved: "Принято", revision: "На доработку",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

async function fetchDashboardData(role: string, userId: string) {
  // For curators we narrow to their assigned students so submission counts and
  // top-XP both reflect only the curator's group, not the whole school.
  let studentIds: string[] | undefined;
  if (role === "curator") {
    const assigned = await supabase.getCuratorStudents(userId);
    if (assigned.length === 0) {
      return { students: [], submissions: [] };
    }
    studentIds = assigned;
  }

  const [leaderRows, submissionRows] = await Promise.all([
    supabase.getLeaderboard(),
    supabase.getSubmissions({ pageSize: 100, studentIds }),
  ]);

  const students: Student[] = leaderRows
    .filter((r) => !studentIds || studentIds.includes(r.user_id))
    .map((r) => ({ id: r.user_id, name: r.name, xp: r.xp }))
    .sort((a, b) => b.xp - a.xp);

  const submissions: SubRow[] = submissionRows.map((r) => ({
    id: r.id,
    userName: r.user_name,
    lessonTitle: r.lesson_title,
    status: r.status as SubmissionStatus,
    submittedAt: r.submitted_at,
  }));

  return { students, submissions };
}

export default async function AdminDashboardPage() {
  const auth = await requireAuth("curator");
  if (auth instanceof NextResponse) redirect("/login");

  const { students, submissions } = await fetchDashboardData(auth.role, auth.appUserId);

  const pendingCount  = submissions.filter((s) => s.status === "pending").length;
  const approvedCount = submissions.filter((s) => s.status === "approved").length;
  const revisionCount = submissions.filter((s) => s.status === "revision").length;
  const avgXP = students.length > 0
    ? Math.round(students.reduce((sum, s) => sum + s.xp, 0) / students.length)
    : 0;

  const recentPending = submissions.filter((s) => s.status === "pending").slice(0, 5);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Обзор</h1>
        <p className="text-sm text-gray-500 mt-0.5">Быстрый срез по группе</p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="👥" label="Учеников" value={String(students.length)} />
        <StatCard
          icon="⏳" label="Ожидают проверки"
          value={String(pendingCount)}
          accent={pendingCount > 0 ? "amber" : undefined}
          href="/admin/homework"
        />
        <StatCard icon="✅" label="Принято работ" value={String(approvedCount)} accent="green" />
        <StatCard icon="⚡" label="Средний XP"    value={String(avgXP)}         accent="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Recent pending ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-400">
              Ожидают проверки
            </h2>
            {pendingCount > 0 && (
              <Link href="/admin/homework" className="text-xs text-primary font-semibold hover:underline">
                Смотреть все →
              </Link>
            )}
          </div>

          {recentPending.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-8 text-center">
              <p className="text-2xl mb-2">🎉</p>
              <p className="text-sm text-gray-400">Все работы проверены!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentPending.map((sub) => (
                <Link key={sub.id} href="/admin/homework">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 hover:border-primary/30 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{sub.userName}</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{sub.lessonTitle}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={cn(
                          "text-[11px] font-bold px-2 py-0.5 rounded-lg border",
                          STATUS_STYLE[sub.status]
                        )}>
                          {STATUS_LABEL[sub.status]}
                        </span>
                        <span className="text-[11px] text-gray-400">{formatDate(sub.submittedAt)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ── Top students ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-400">
              Топ учеников по XP
            </h2>
            <Link href="/admin/students" className="text-xs text-primary font-semibold hover:underline">
              Все ученики →
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {students.slice(0, 5).map((s, idx) => (
              <Link key={s.id} href={`/admin/students/${s.id}`}>
                <div className={cn(
                  "flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors",
                  idx < Math.min(students.length, 5) - 1 && "border-b border-gray-50"
                )}>
                  <span className="text-sm font-black text-gray-300 w-5 tabular-nums">{idx + 1}</span>
                  <span className="text-sm font-semibold text-gray-800 flex-1 truncate">{s.name}</span>
                  <span className="text-sm font-black text-primary tabular-nums">{s.xp} XP</span>
                </div>
              </Link>
            ))}
            {students.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-gray-400">Нет данных</div>
            )}
          </div>
        </section>
      </div>

      {submissions.length > 0 && (
        <div className="mt-6 flex items-center gap-4 text-xs text-gray-400">
          <span>Всего сдач: <b className="text-gray-600">{submissions.length}</b></span>
          <span>·</span>
          <span>Принято: <b className="text-green-600">{approvedCount}</b></span>
          <span>·</span>
          <span>На доработку: <b className="text-red-500">{revisionCount}</b></span>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, accent, href,
}: {
  icon: string;
  label: string;
  value: string;
  accent?: "amber" | "green" | "purple";
  href?: string;
}) {
  const inner = (
    <div className={cn(
      "rounded-2xl border p-5 transition-all",
      accent === "amber"  ? "bg-amber-50 border-amber-100" :
      accent === "green"  ? "bg-green-50 border-green-100" :
      accent === "purple" ? "bg-primary/5 border-primary/15" :
      "bg-white border-gray-100 shadow-sm",
      href && "hover:shadow-md cursor-pointer"
    )}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className={cn(
        "text-3xl font-black",
        accent === "amber"  ? "text-amber-600" :
        accent === "green"  ? "text-green-600" :
        accent === "purple" ? "text-primary" :
        "text-gray-900"
      )}>
        {value}
      </p>
    </div>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}
