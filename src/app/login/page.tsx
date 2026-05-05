"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { useUserStore } from "@/store/userStore";

const features = [
  "Повторяй материал после урока",
  "Проверяй знания практикой",
  "Зарабатывай XP и уровни",
  "Соревнуйся с другими",
];

export default function LoginPage() {
  const router  = useRouter();
  const login   = useUserStore((s) => s.login);

  const [username, setUsername] = useState("");
  const [pass,     setPass]     = useState("");
  const [err,      setErr]      = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);

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
    "placeholder:text-text-subtle transition-colors duration-200 " +
    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ";

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-bg">

      {/* ── Левая — брендовая ── */}
      <div className="hidden md:flex flex-col justify-between bg-dark px-14 py-12">
        <Image
          src="/logo-white.png"
          alt="AI Trend"
          width={144}
          height={40}
          priority
        />

        <div>
          <h2 className="text-5xl font-black text-white leading-[1.05] mb-10 tracking-tight">
            Учись лучше<br />
            <span className="text-accent">после каждого</span><br />
            урока
          </h2>

          <ul className="flex flex-col gap-3">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-3 text-white/70 text-sm">
                <span className="w-1 h-1 rounded-full bg-accent" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-white/30 text-xs">Платформа для учеников 10–16 лет</p>
      </div>

      {/* ── Правая — форма ── */}
      <div className="flex flex-col items-center justify-center px-6 py-12 min-h-screen md:min-h-0">

        {/* Мобильное лого */}
        <div className="mb-10 md:hidden">
          <Image src="/logo.png" alt="AI Trend" width={120} height={33} priority />
        </div>

        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-black text-text mb-2 tracking-tight">Добро пожаловать</h1>
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
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={pass}
                  onChange={(e) => { setPass(e.target.value); setErr(false); }}
                  required
                  autoComplete="current-password"
                  className={inputCls + "pr-11 " + (err ? "border-error" : "border-border hover:border-gray-300")}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                  aria-label={showPass ? "Скрыть пароль" : "Показать пароль"}
                >
                  {showPass ? (
                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                      <path d="m4 4 16 16M10.5 10.7a2 2 0 0 0 2.8 2.8M9.4 5.5A10 10 0 0 1 12 5c5 0 9 4 10 7-.4 1-1.2 2.4-2.5 3.7M6.2 7.4C4.4 8.9 3.3 10.7 3 12c1 3 4.5 7 9 7 1.7 0 3.3-.5 4.7-1.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  )}
                </button>
              </div>
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

          <p className="text-center text-xs text-text-muted mt-8 leading-relaxed">
            Логин и пароль выдаёт преподаватель.<br />
            Если нет доступа — обратись к нему.
          </p>
        </div>
      </div>
    </div>
  );
}
