"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Group {
  id: string;
  name: string;
  tier: "smart" | "vip";
  created_at: string;
  students_count: number;
}

const TIER_BADGE: Record<Group["tier"], string> = {
  smart: "bg-violet-50 text-violet-700 border-violet-200",
  vip:   "bg-amber-50 text-amber-700 border-amber-200",
};

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [tier, setTier] = useState<Group["tier"]>("smart");
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    setLoading(true);
    fetch("/api/curator/groups")
      .then((r) => r.json())
      .then((data: { groups?: Group[] }) => setGroups(data.groups ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { refresh(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/curator/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), tier }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Ошибка создания");
        return;
      }
      setName("");
      setTier("smart");
      refresh();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Группы</h1>
          <p className="text-sm text-gray-500 mt-1">Создавай группы и распределяй учеников по тарифам.</p>
        </div>
      </div>

      <form onSubmit={submit} className="mb-8 bg-white border border-gray-200 rounded-2xl p-5 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
            Название группы
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например, Понедельник 18:00"
            maxLength={80}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
            Тариф
          </label>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as Group["tier"])}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-primary"
          >
            <option value="smart">Smart</option>
            <option value="vip">VIP</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={creating || !name.trim()}
          className="px-5 py-2 bg-primary text-white font-bold text-sm rounded-lg disabled:opacity-50 hover:bg-primary/90 transition-colors"
        >
          {creating ? "Создаём…" : "Создать"}
        </button>
        {error && <p className="basis-full text-sm text-red-600 mt-2">{error}</p>}
      </form>

      {loading && (
        <p className="text-sm text-gray-500">Загружаем группы…</p>
      )}

      {!loading && groups.length === 0 && (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-10 text-center">
          <p className="text-gray-500">У тебя пока нет ни одной группы. Создай первую сверху.</p>
        </div>
      )}

      {!loading && groups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((g) => (
            <Link
              key={g.id}
              href={`/admin/groups/${g.id}`}
              className="block bg-white border border-gray-200 rounded-2xl p-5 hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-md border ${TIER_BADGE[g.tier]}`}>
                  {g.tier}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(g.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                </span>
              </div>
              <p className="font-black text-gray-900 text-lg leading-tight">{g.name}</p>
              <p className="text-sm text-gray-500 mt-2">
                {g.students_count} {pluralStudents(g.students_count)}
                {g.tier === "vip" && g.students_count >= 1 && " · VIP заполнена"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function pluralStudents(n: number): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return "учеников";
  if (last === 1) return "ученик";
  if (last >= 2 && last <= 4) return "ученика";
  return "учеников";
}
