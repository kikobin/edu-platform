"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LEVELS, type AvatarId } from "@/types";

interface Student {
  id: string;
  name: string;
  avatarId: AvatarId;
  xp: number;
}

const AVATAR_COLORS: Record<AvatarId, string> = {
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

function getLevel(xp: number) {
  return [...LEVELS].reverse().find((l) => xp >= l.minXP) ?? LEVELS[0]!;
}

function XPBar({ xp }: { xp: number }) {
  const level = getLevel(xp);
  const range = level.maxXP - level.minXP;
  const pct = range > 0 ? Math.min(100, Math.round(((xp - level.minXP) / range) * 100)) : 100;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400 tabular-nums w-14 text-right">{xp} XP</span>
    </div>
  );
}

function AvatarImg({ id }: { id: AvatarId }) {
  return (
    <div
      className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0"
      style={{ background: AVATAR_COLORS[id] ?? "#e0e7ff" }}
    >
      {AVATAR_EMOJI[id] ?? "🙂"}
    </div>
  );
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/students")
      .then((r) => r.json())
      .then((data) => { setStudents(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Ученики</h1>
          <p className="text-sm text-gray-500 mt-0.5">{students.length} человек в группе</p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по имени..."
          className="w-52 px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3.5 text-[11px] font-black uppercase tracking-[0.12em] text-gray-400">#</th>
              <th className="text-left px-5 py-3.5 text-[11px] font-black uppercase tracking-[0.12em] text-gray-400">Ученик</th>
              <th className="text-left px-5 py-3.5 text-[11px] font-black uppercase tracking-[0.12em] text-gray-400">Уровень</th>
              <th className="text-left px-5 py-3.5 text-[11px] font-black uppercase tracking-[0.12em] text-gray-400 w-52">XP</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-gray-400 text-sm">
                  Загружаем данные...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-gray-400 text-sm">
                  {search ? "Никого не нашли" : "Нет данных"}
                </td>
              </tr>
            ) : (
              filtered.map((student, idx) => {
                const level = getLevel(student.xp);
                return (
                  <tr key={student.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors group">
                    <td className="px-5 py-4 text-sm font-bold text-gray-300 tabular-nums w-10">
                      {idx + 1}
                    </td>
                    <td className="px-5 py-4">
                      <Link href={`/admin/students/${student.id}`} className="flex items-center gap-3">
                        <AvatarImg id={student.avatarId} />
                        <span className="text-sm font-semibold text-gray-800 group-hover:text-primary transition-colors">
                          {student.name}
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/8 text-primary text-xs font-bold">
                        {level.level} · {level.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 w-52">
                      <XPBar xp={student.xp} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && students.length > 0 && (
        <p className="text-xs text-gray-400 mt-3 text-right">
          Прогресс синхронизируется с Supabase в реальном времени
        </p>
      )}
    </div>
  );
}
