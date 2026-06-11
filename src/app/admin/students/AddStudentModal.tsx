"use client";

import { useEffect, useState } from "react";
import type { AvatarId } from "@/types";

interface Group {
  id: string;
  name: string;
  tier: "smart" | "vip";
}

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

const AVATAR_CHOICES: AvatarId[] = [
  "avatar_1", "avatar_2", "avatar_3", "avatar_4",
  "avatar_5", "avatar_6", "avatar_7", "avatar_8",
];

const AVATAR_EMOJI: Record<string, string> = {
  avatar_1: "😎", avatar_2: "🌟", avatar_3: "🦊", avatar_4: "🐉",
  avatar_5: "🚀", avatar_6: "🎯", avatar_7: "⚡", avatar_8: "🎮",
};

export default function AddStudentModal({ onClose, onCreated }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [avatarId, setAvatarId] = useState<AvatarId>("avatar_1");
  const [groupId, setGroupId]   = useState<string>("");
  const [groups, setGroups]     = useState<Group[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/groups")
      .then((r) => r.json())
      .then((d) => setGroups(d.groups ?? []))
      .catch(() => setGroups([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          password,
          name: name.trim(),
          avatarId,
          groupId: groupId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Не удалось создать");
        setSubmitting(false);
        return;
      }
      onCreated();
    } catch {
      setError("Сетевая ошибка");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
      >
        <h2 className="text-xl font-black text-gray-900 mb-1">Новый ученик</h2>
        <p className="text-xs text-gray-500 mb-5">Логин и пароль сообщи ученику лично</p>

        <div className="space-y-4">
          <Field label="Логин (латиница, цифры, _)" hint="3–30 символов, без пробелов">
            <input
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ivan_petrov"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
              autoComplete="off"
            />
          </Field>

          <Field label="Пароль">
            <input
              required
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="мин. 6 символов"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
              autoComplete="off"
            />
          </Field>

          <Field label="Имя и фамилия">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Иван Петров"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
            />
          </Field>

          <Field label="Группа">
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 bg-white"
            >
              <option value="">— Без группы —</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} {g.tier === "vip" ? "(VIP)" : ""}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Аватар">
            <div className="flex gap-2 flex-wrap">
              {AVATAR_CHOICES.map((id) => (
                <button
                  type="button"
                  key={id}
                  onClick={() => setAvatarId(id)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                    avatarId === id
                      ? "ring-2 ring-primary scale-110"
                      : "ring-1 ring-gray-200 hover:ring-primary/40"
                  }`}
                  style={{ background: "#f3f4f6" }}
                >
                  {AVATAR_EMOJI[id]}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {error && (
          <div className="mt-4 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-4 py-2.5 text-sm font-bold rounded-xl bg-white border border-gray-200 hover:border-gray-300 disabled:opacity-40"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-4 py-2.5 text-sm font-bold rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-40"
          >
            {submitting ? "Создаём..." : "Создать"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs font-bold text-gray-700">{label}</span>
        {hint && <span className="text-[10px] text-gray-400">{hint}</span>}
      </div>
      {children}
    </label>
  );
}
