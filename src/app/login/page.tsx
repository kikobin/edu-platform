"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useUserStore } from "@/store/userStore";

const features = [
  { icon: "📖", text: "Повторяй материал после урока" },
  { icon: "✏️", text: "Проверяй знания с закреплением" },
  { icon: "⚡", text: "Зарабатывай XP и повышай уровень" },
  { icon: "🏆", text: "Соревнуйся с другими учениками" },
];

export default function LoginPage() {
  const router  = useRouter();
  const login   = useUserStore((s) => s.login);

  const [username, setUsername] = useState("");
  const [pass,     setPass]     = useState("");
  const [err,      setErr]      = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(false);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password: pass }),
      });

      if (!res.ok) {
        setErr(true);
        setLoading(false);
        return;
      }

      const { user } = await res.json();
      login(user);
      const isAdmin = user.role === "admin" || user.role === "curator";
      router.push(isAdmin ? "/admin" : "/dashboard");
    } catch {
      setErr(true);
      setLoading(false);
    }
  };

  const inputCls =
    "w-full px-4 py-3 rounded-lg border bg-white text-text text-sm " +
    "placeholder:text-text-subtle transition-all duration-200 " +
    "focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary ";

  return (
    <div className="min-h-screen grid md:grid-cols-2">

      {/* ── Левая — брендовая ── */}
      <div className="hidden md:flex flex-col justify-between bg-dark px-12 py-12 relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-accent/15 rounded-full blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
            <span className="text-dark font-black text-lg">E</span>
          </div>
          <span className="text-white font-black text-xl">EduPlatform</span>
        </div>

        <div className="relative z-10">
          <h2 className="text-5xl font-black text-white leading-tight mb-6 tracking-tight">
            Учись лучше<br />
            <span className="text-accent">после каждого</span><br />
            урока
          </h2>

          <div className="flex flex-col gap-4">
            {features.map((f, i) => (
              <div
                key={f.text}
                className="flex items-center gap-4"
              >
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl shrink-0">
                  {f.icon}
                </div>
                <span className="text-white/70 text-sm font-medium">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-white/30 text-xs">Платформа создана для учеников 10–16 лет</p>
        </div>
      </div>

      {/* ── Правая — форма ── */}
      <div className="flex flex-col items-center justify-center px-6 py-12 bg-bg min-h-screen md:min-h-0">

        {/* Мобильное лого */}
        <div className="flex items-center gap-2 mb-10 md:hidden">
          <div className="w-9 h-9 bg-dark rounded-xl flex items-center justify-center">
            <span className="text-accent font-black">E</span>
          </div>
          <span className="font-black text-text text-xl">EduPlatform</span>
        </div>

        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-black text-text mb-1 tracking-tight">Добро пожаловать</h1>
          <p className="text-text-muted text-sm mb-8">Войди, чтобы продолжить учёбу</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-text mb-1.5">Логин</label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setErr(false); }}
                required
                autoComplete="username"
                autoCapitalize="none"
                className={inputCls + (err ? "border-error" : "border-border hover:border-gray-300")}
                placeholder="твой логин"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text mb-1.5">Пароль</label>
              <input
                type="password"
                value={pass}
                onChange={(e) => { setPass(e.target.value); setErr(false); }}
                required
                autoComplete="current-password"
                className={inputCls + (err ? "border-error" : "border-border hover:border-gray-300")}
                placeholder="••••••••"
              />
            </div>

            {err && (
              <p className="text-error text-sm font-medium -mt-1">
                Неверный логин или пароль. Попробуй ещё раз.
              </p>
            )}

            <Button type="submit" fullWidth size="lg" loading={loading} className="mt-2">
              {loading ? "Входим..." : "Войти →"}
            </Button>
          </form>

          <p className="text-center text-xs text-text-muted mt-6 leading-relaxed">
            Логин и пароль выдаёт преподаватель.<br />
            Если нет доступа — обратись к нему.
          </p>
        </div>
      </div>
    </div>
  );
}
