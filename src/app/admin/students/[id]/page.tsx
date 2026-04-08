"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getLevelByXP, getProgressToNextLevel } from "@/lib/xp";
import { useIsAdmin } from "@/hooks/useRole";
import type { AvatarId, SubmissionStatus } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentDetail {
  student: { id: string; name: string; avatarId: AvatarId };
  xp: number;
  lessonsSummary: LessonSummary[];
  submissions: SubRow[];
}

interface LessonSummary {
  lessonId: string;
  lessonTitle: string;
  lessonOrder: number;
  reviewDone: boolean;
  practiceDone: boolean;
  practiceScore: number;
  submissionStatus: SubmissionStatus | null;
  submittedAt: string | null;
  curatorComment: string | null;
}

interface SubRow {
  id: string;
  lessonId: string;
  lessonTitle: string;
  homeworkTitle: string;
  content: string;
  submitType: string;
  status: SubmissionStatus;
  curatorComment?: string;
  submittedAt: string;
  reviewedAt?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AVATAR_COLOR: Record<AvatarId, string> = {
  avatar_1: "#e0e7ff", avatar_2: "#fce7f3", avatar_3: "#d1fae5",
  avatar_4: "#fef3c7", avatar_5: "#dbeafe", avatar_6: "#ede9fe",
  avatar_7: "#fef9c3", avatar_8: "#fee2e2",
  av_dragon: "#10b981", av_eagle: "#0ea5e9", av_robot: "#475569",
  av_wizard: "#7c3aed", av_ninja: "#27272a", av_astronaut: "#4338ca",
};
const AVATAR_EMOJI: Record<AvatarId, string> = {
  avatar_1: "😎", avatar_2: "🌟", avatar_3: "🦊",
  avatar_4: "🐉", avatar_5: "🚀", avatar_6: "🎯",
  avatar_7: "⚡", avatar_8: "🎮",
  av_dragon: "🐉", av_eagle: "🦅", av_robot: "🤖",
  av_wizard: "🧙", av_ninja: "🥷", av_astronaut: "👨‍🚀",
};

const STATUS_LABEL: Record<SubmissionStatus, string> = {
  pending: "Ожидает", approved: "Принято", revision: "На доработку",
};
const STATUS_STYLE: Record<SubmissionStatus, string> = {
  pending: "bg-amber-50 text-amber-600 border-amber-200",
  approved: "bg-green-50 text-green-600 border-green-200",
  revision: "bg-red-50 text-red-600 border-red-200",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function StatusBadge({ status }: { status: SubmissionStatus }) {
  return (
    <span className={cn(
      "inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-lg border",
      STATUS_STYLE[status]
    )}>
      {STATUS_LABEL[status]}
    </span>
  );
}

// ─── XP Editor (admin only) ───────────────────────────────────────────────────

function XPEditor({ studentId, currentXP, onUpdate }: {
  studentId: string;
  currentXP: number;
  onUpdate: (newXP: number) => void;
}) {
  const [delta, setDelta] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const apply = async (sign: 1 | -1) => {
    const val = parseInt(delta, 10);
    if (!val || val <= 0) { setError("Введи положительное число"); return; }
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/students/${studentId}/xp`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta: sign * val }),
    });
    const data = await res.json();
    if (res.ok) {
      onUpdate(data.xp);
      setDelta("");
    } else {
      setError(data.error ?? "Ошибка");
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-primary/20 shadow-sm p-5">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-primary/70 mb-3">
        🔧 Корректировка XP (только admin)
      </p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          value={delta}
          onChange={(e) => { setDelta(e.target.value); setError(""); }}
          placeholder="Сколько XP"
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
        />
        <button
          onClick={() => apply(1)}
          disabled={loading}
          className="px-3 py-2 text-sm font-bold rounded-xl bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-all disabled:opacity-50"
        >
          +XP
        </button>
        <button
          onClick={() => apply(-1)}
          disabled={loading}
          className="px-3 py-2 text-sm font-bold rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all disabled:opacity-50"
        >
          −XP
        </button>
      </div>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const [data, setData] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [xp, setXP] = useState(0);

  useEffect(() => {
    fetch(`/api/admin/students/${id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d: StudentDetail) => { setData(d); setXP(d.xp); setLoading(false); })
      .catch(() => { setFetchError(true); setLoading(false); });
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400 text-sm">Загружаем данные...</p>
      </div>
    );
  }

  if (fetchError || !data) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <p className="text-3xl">😕</p>
        <p className="text-gray-500 text-sm">Ученик не найден</p>
        <button onClick={() => router.back()} className="text-sm text-primary hover:underline">← Назад</button>
      </div>
    );
  }

  const { student, lessonsSummary, submissions } = data;
  const level = getLevelByXP(xp);
  const pct = getProgressToNextLevel(xp);
  const approvedCount  = submissions.filter((s) => s.status === "approved").length;
  const pendingCount   = submissions.filter((s) => s.status === "pending").length;
  const revisionCount  = submissions.filter((s) => s.status === "revision").length;
  const lessonsStarted = lessonsSummary.filter((l) => l.reviewDone || l.practiceDone || l.submissionStatus !== null).length;
  const lessonsCompleted = lessonsSummary.filter(
    (l) => l.reviewDone && l.practiceDone && l.submissionStatus === "approved"
  ).length;
  const approvalRate = submissions.length > 0
    ? Math.round((approvedCount / submissions.length) * 100)
    : 0;

  return (
    <div className="p-8 max-w-3xl">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-6"
      >
        ← Все ученики
      </button>

      {/* ── Student Header ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0"
            style={{ background: AVATAR_COLOR[student.avatarId] ?? "#e0e7ff" }}
          >
            {AVATAR_EMOJI[student.avatarId] ?? "🙂"}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-gray-900 mb-1">{student.name}</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/8 text-primary text-xs font-bold mb-3">
              Уровень {level.level} · {level.label}
            </span>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-sm font-bold text-gray-700 tabular-nums">{xp} XP</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5">
          <StatCard label="Всего сдано" value={submissions.length} icon="📤" />
          <StatCard label="Принято" value={approvedCount} icon="✅" accent="green" />
          <StatCard label="Ожидают" value={pendingCount} icon="⏳" accent={pendingCount > 0 ? "amber" : undefined} />
        </div>
      </div>

      {/* ── Statistics ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-400 mb-4">Статистика</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          <StatRow label="Уроков начато" value={`${lessonsStarted} из ${lessonsSummary.length}`} />
          <StatRow label="Полностью закрыто" value={`${lessonsCompleted} из ${lessonsSummary.length}`} />
          <StatRow label="Процент принятия" value={submissions.length > 0 ? `${approvalRate}%` : "—"} />
          <StatRow label="На доработку" value={String(revisionCount)} warn={revisionCount > 0} />
          <StatRow label="Текущий уровень" value={`${level.level} — ${level.label}`} />
          <StatRow label="XP до следующего" value={xp >= 1000 ? "Макс." : `${(level.maxXP + 1) - xp} XP`} />
        </div>
      </div>

      {/* ── Admin XP editor ── */}
      {isAdmin && (
        <div className="mb-6">
          <XPEditor studentId={student.id} currentXP={xp} onUpdate={setXP} />
        </div>
      )}

      {/* ── Lessons Progress ── */}
      <section className="mb-6">
        <h2 className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-400 mb-3">
          Прогресс по урокам
        </h2>
        <div className="space-y-2">
          {lessonsSummary.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-8 text-center text-sm text-gray-400">
              Уроки ещё не начаты
            </div>
          ) : (
            lessonsSummary.map((ls) => <LessonRow key={ls.lessonId} lesson={ls} />)
          )}
        </div>
      </section>

      {/* ── Submissions History ── */}
      <section>
        <h2 className="text-[11px] font-black uppercase tracking-[0.14em] text-gray-400 mb-3">
          История сдач
        </h2>
        {submissions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-8 text-center">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm text-gray-400">Домашних заданий ещё не сдавал</p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((sub) => <SubmissionCard key={sub.id} sub={sub} />)}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, icon, accent }: {
  label: string; value: number; icon: string; accent?: "green" | "amber";
}) {
  return (
    <div className={cn(
      "rounded-xl border px-4 py-3",
      accent === "green" ? "bg-green-50 border-green-100" :
      accent === "amber" ? "bg-amber-50 border-amber-100" :
      "bg-gray-50 border-gray-100"
    )}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-sm">{icon}</span>
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <p className={cn(
        "text-2xl font-black",
        accent === "green" ? "text-green-600" :
        accent === "amber" ? "text-amber-600" :
        "text-gray-800"
      )}>
        {value}
      </p>
    </div>
  );
}

function StatRow({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={cn("text-sm font-bold tabular-nums", warn ? "text-red-500" : "text-gray-800")}>
        {value}
      </span>
    </div>
  );
}

function StepDot({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn(
        "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0",
        done ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"
      )}>
        {done ? "✓" : "·"}
      </div>
      <span className={cn("text-xs font-medium", done ? "text-green-600" : "text-gray-400")}>
        {label}
      </span>
    </div>
  );
}

function LessonRow({ lesson }: { lesson: LessonSummary }) {
  const { lessonTitle, lessonOrder, reviewDone, practiceDone, practiceScore,
          submissionStatus, submittedAt, curatorComment } = lesson;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Урок {lessonOrder}</span>
          </div>
          <p className="text-sm font-semibold text-gray-800">{lessonTitle}</p>
          {submittedAt && <p className="text-xs text-gray-400 mt-0.5">Сдано {formatDate(submittedAt)}</p>}
        </div>
        <div className="shrink-0 pt-0.5">
          {submissionStatus ? (
            <StatusBadge status={submissionStatus} />
          ) : (
            <span className="text-[11px] font-semibold text-gray-300 border border-gray-100 px-2 py-0.5 rounded-lg bg-gray-50">
              Не сдан
            </span>
          )}
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-4">
        <StepDot done={reviewDone} label="Повторение" />
        <StepDot done={practiceDone} label={`Закрепление${practiceDone ? ` (${practiceScore}%)` : ""}`} />
        <StepDot done={submissionStatus !== null} label="Домашка" />
      </div>

      {curatorComment && (
        <div className="flex gap-1.5 mt-3 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
          <span>💬</span>
          <span>{curatorComment}</span>
        </div>
      )}
    </div>
  );
}

function SubmissionCard({ sub }: { sub: SubRow }) {
  return (
    <div className={cn(
      "bg-white rounded-2xl border shadow-sm p-5",
      sub.status === "approved" ? "border-green-100 opacity-75" : "border-gray-100"
    )}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{sub.lessonTitle}</p>
          <p className="text-xs text-gray-400 mt-0.5">{sub.homeworkTitle}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={sub.status} />
          <span className="text-[11px] text-gray-400">{formatDate(sub.submittedAt)}</span>
        </div>
      </div>

      {sub.content && (
        <div className="bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-700 break-all">
          {sub.submitType === "link" ? (
            <a href={sub.content} target="_blank" rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/80">
              {sub.content}
            </a>
          ) : sub.content}
        </div>
      )}

      {sub.curatorComment && (
        <div className="flex gap-2 mt-3 bg-blue-50 rounded-xl px-4 py-3 text-sm text-blue-700">
          <span>💬</span>
          <span>{sub.curatorComment}</span>
        </div>
      )}
    </div>
  );
}
