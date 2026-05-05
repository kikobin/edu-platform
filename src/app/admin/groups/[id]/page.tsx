"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ALL_LESSONS } from "@/content/study-lessons";
import { MODULES } from "@/content/study-modules";

interface Group {
  id: string;
  name: string;
  tier: "smart" | "vip";
  curator_id: string;
  created_at: string;
}
interface Student {
  id: string;          // profile UUID
  app_user_id: string;
  name: string;
  avatar_id: string;
  xp: number;
  tier: string;
}
interface Candidate {
  id: string;          // profile UUID
  app_user_id: string;
  name: string;
  avatar_id: string;
}

export default function GroupDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();

  const [group, setGroup] = useState<Group | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ added: number; notFound: string[]; failed: string[] } | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [unlockTarget, setUnlockTarget] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [unlockResult, setUnlockResult] = useState<{
    students: number;
    totalUnlocked: number;
    conflicts: number;
    failed: { appUserId: string; name: string }[];
  } | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    fetch(`/api/curator/groups/${id}`)
      .then((r) => r.json())
      .then((data: { group?: Group; students?: Student[] }) => {
        setGroup(data.group ?? null);
        setStudents(data.students ?? []);
        setEditName(data.group?.name ?? "");
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { refresh(); }, [refresh]);

  const openPicker = async () => {
    setPickerOpen(true);
    const res = await fetch(`/api/curator/groups/${id}/students`);
    const data = await res.json();
    setCandidates(data.candidates ?? []);
  };

  const addStudent = async (studentProfileId: string) => {
    setError(null);
    const res = await fetch(`/api/curator/groups/${id}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentProfileId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Не удалось добавить");
      return;
    }
    setPickerOpen(false);
    refresh();
  };

  const removeStudent = async (studentProfileId: string) => {
    if (!confirm("Убрать ученика из группы? Тариф сохранится, ученик останется без группы.")) return;
    const res = await fetch(`/api/curator/groups/${id}/students/${studentProfileId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Не удалось убрать");
      return;
    }
    refresh();
  };

  const rename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || editName === group?.name) {
      setRenaming(false);
      return;
    }
    const res = await fetch(`/api/curator/groups/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });
    if (res.ok) {
      setRenaming(false);
      refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Не удалось переименовать");
    }
  };

  const runImport = async () => {
    const ids = importText
      .split(/[\n,;\t]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) {
      setError("Добавь хотя бы один app_user_id");
      return;
    }
    setImporting(true);
    setImportResult(null);
    const res = await fetch(`/api/curator/groups/${id}/students/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appUserIds: ids }),
    });
    setImporting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Не удалось импортировать");
      return;
    }
    const data = await res.json();
    setImportResult(data);
    refresh();
  };

  const runUnlockUpTo = async () => {
    if (!unlockTarget) {
      setError("Выбери урок");
      return;
    }
    const lesson = ALL_LESSONS.find((l) => l.slug === unlockTarget);
    if (!lesson) return;
    if (!confirm(
      `Открыть всем ${students.length} ученикам группы все уроки до «${lesson.title}» включительно? ` +
      `Это пометит уроки как пройденные и начислит XP. Уведомления не отправляются.`,
    )) return;
    setUnlocking(true);
    setUnlockResult(null);
    setError(null);
    const res = await fetch(`/api/curator/groups/${id}/unlock-up-to`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonSlug: unlockTarget }),
    });
    setUnlocking(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Не удалось открыть уроки");
      return;
    }
    const data = await res.json();
    setUnlockResult(data);
  };

  const changeTier = async (newTier: "smart" | "vip") => {
    if (newTier === group?.tier) return;
    if (students.length > 0) {
      setError("Чтобы сменить тариф, сначала убери всех учеников из группы.");
      return;
    }
    if (!confirm(`Сменить тариф на ${newTier.toUpperCase()}?`)) return;
    const res = await fetch(`/api/curator/groups/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier: newTier }),
    });
    if (res.ok) refresh();
    else {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Не удалось сменить тариф");
    }
  };

  const deleteGroup = async () => {
    if (!confirm(`Удалить группу «${group?.name}»? Это можно сделать только если в ней нет учеников.`)) return;
    const res = await fetch(`/api/curator/groups/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/groups");
      return;
    }
    const data = await res.json().catch(() => ({}));
    setError(data?.error === "Group is not empty"
      ? "Сначала убери всех учеников из группы."
      : data?.error ?? "Не удалось удалить");
  };

  if (loading && !group) {
    return <div className="p-8 text-sm text-gray-500">Загружаем…</div>;
  }
  if (!group) {
    return (
      <div className="p-8">
        <p className="text-sm text-gray-500">Группа не найдена.</p>
        <Link href="/admin/groups" className="text-primary text-sm mt-3 inline-block">← К списку групп</Link>
      </div>
    );
  }

  const vipFull = group.tier === "vip" && students.length >= 1;

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/admin/groups" className="text-sm text-gray-500 hover:text-gray-700 mb-3 inline-block">
        ← К группам
      </Link>

      <div className="flex items-start justify-between mb-2">
        {!renaming ? (
          <div>
            <h1 className="text-2xl font-black text-gray-900">{group.name}</h1>
            <button
              onClick={() => setRenaming(true)}
              className="text-xs text-gray-400 hover:text-gray-600 mt-1"
            >
              Переименовать
            </button>
          </div>
        ) : (
          <form onSubmit={rename} className="flex items-center gap-2">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              maxLength={80}
              autoFocus
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-lg font-bold focus:outline-none focus:border-primary"
            />
            <button type="submit" className="text-xs px-2 py-1 bg-primary text-white rounded-md font-bold">OK</button>
            <button type="button" onClick={() => { setRenaming(false); setEditName(group.name); }} className="text-xs px-2 py-1 text-gray-500">Отмена</button>
          </form>
        )}

        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-md border ${
            group.tier === "vip" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-violet-50 text-violet-700 border-violet-200"
          }`}>
            {group.tier}
          </span>
          {students.length === 0 && (
            <button
              onClick={() => changeTier(group.tier === "smart" ? "vip" : "smart")}
              className="text-[10px] text-gray-400 hover:text-primary"
              title="Сменить тариф (только для пустой группы)"
            >
              ↔ {group.tier === "smart" ? "VIP" : "Smart"}
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Создана {new Date(group.created_at).toLocaleDateString("ru-RU")} ·{" "}
        {students.length} {students.length === 1 ? "ученик" : "учеников"}
      </p>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {students.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
          <h2 className="font-black text-gray-900 mb-1">Открыть уроки до…</h2>
          <p className="text-xs text-gray-500 mb-3">
            Для миграции группы с другой платформы. Откроет всем ученикам все уроки до выбранного включительно
            (как пройденные, с XP). Уведомления не шлются. Идемпотентно — можно нажать дважды.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={unlockTarget}
              onChange={(e) => { setUnlockTarget(e.target.value); setUnlockResult(null); }}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
            >
              <option value="">— выбери последний пройденный урок —</option>
              {MODULES.filter((m) => m.status === "available").map((m) => {
                const moduleLessons = ALL_LESSONS.filter((l) => l.module === m.slug);
                if (moduleLessons.length === 0) return null;
                return (
                  <optgroup key={m.slug} label={m.title}>
                    {moduleLessons.map((l, idx) => (
                      <option key={l.slug} value={l.slug}>
                        Урок {idx + 1}: {l.title}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
            <button
              onClick={runUnlockUpTo}
              disabled={unlocking || !unlockTarget}
              className="px-4 py-2 text-sm font-bold rounded-xl bg-primary text-white disabled:opacity-50 whitespace-nowrap"
            >
              {unlocking ? "Открываем…" : `Открыть для ${students.length}`}
            </button>
          </div>
          {unlockResult && (
            <div className="mt-3 text-xs space-y-1">
              <p className="text-green-700 font-semibold">
                ✓ Открыто {unlockResult.totalUnlocked} уроков для {unlockResult.students} учеников
                {unlockResult.conflicts > 0 && ` (${unlockResult.conflicts} уже были открыты)`}
              </p>
              {unlockResult.failed.length > 0 && (
                <p className="text-red-600">
                  Ошибка для: {unlockResult.failed.map((f) => f.name).join(", ")}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-4">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-2">
          <h2 className="font-black text-gray-900">Ученики</h2>
          <div className="flex items-center gap-3">
            {group.tier === "smart" && (
              <button
                onClick={() => { setImportOpen(true); setImportText(""); setImportResult(null); }}
                className="text-xs font-bold text-gray-500 hover:text-primary"
                title="Добавить сразу несколько по списку app_user_id"
              >
                Импорт CSV
              </button>
            )}
            {!vipFull && (
              <button
                onClick={openPicker}
                className="text-sm font-bold text-primary hover:text-primary/80"
              >
                + Добавить
              </button>
            )}
          </div>
        </div>
        {students.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            В группе пока никого нет. Нажми «Добавить» чтобы пригласить ученика.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {students.map((s) => (
              <li key={s.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900 text-sm">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.app_user_id} · {s.xp} XP</p>
                </div>
                <button
                  onClick={() => removeStudent(s.id)}
                  className="text-xs text-gray-400 hover:text-red-600"
                >
                  Убрать
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {students.length === 0 && (
        <button
          onClick={deleteGroup}
          className="text-xs text-gray-400 hover:text-red-600"
        >
          Удалить группу
        </button>
      )}

      {importOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setImportOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-black text-gray-900">Импорт учеников</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                По одному <code className="bg-gray-100 px-1 rounded">app_user_id</code> в строке (или через запятую/таб). Пример: <code className="bg-gray-100 px-1 rounded">danial</code>
              </p>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={8}
                placeholder={"danial\nbegarys\nnailia"}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all font-mono"
              />
              {importResult && (
                <div className="mt-3 text-xs space-y-1">
                  <p className="text-green-700 font-semibold">Добавлено: {importResult.added}</p>
                  {importResult.notFound.length > 0 && (
                    <p className="text-amber-700">
                      Не найдены / не свободны: {importResult.notFound.join(", ")}
                    </p>
                  )}
                  {importResult.failed.length > 0 && (
                    <p className="text-red-600">
                      Не удалось добавить: {importResult.failed.join(", ")}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                onClick={() => setImportOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Закрыть
              </button>
              <button
                onClick={runImport}
                disabled={importing}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-primary text-white disabled:opacity-50"
              >
                {importing ? "Импортируем..." : "Импортировать"}
              </button>
            </div>
          </div>
        </div>
      )}

      {pickerOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setPickerOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-black text-gray-900">Добавить ученика</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Свободные ученики тарифа {group.tier}
              </p>
            </div>
            <div className="overflow-y-auto flex-1">
              {candidates.length === 0 ? (
                <p className="p-6 text-sm text-gray-500 text-center">
                  Нет свободных учеников этого тарифа.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {candidates.map((c) => (
                    <li key={c.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{c.name}</p>
                        <p className="text-xs text-gray-500">{c.app_user_id}</p>
                      </div>
                      <button
                        onClick={() => addStudent(c.id)}
                        className="text-xs font-bold text-primary hover:text-primary/80"
                      >
                        Добавить
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="px-5 py-3 border-t border-gray-100 text-right">
              <button
                onClick={() => setPickerOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
