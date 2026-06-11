"use client";

import { useEffect, useRef, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageTransition } from "@/components/layout/PageTransition";
import { useUserStore } from "@/store/userStore";
import { useProgressStore } from "@/store/progressStore";
import { getLevelByXP, getProgressToNextLevel, getNextLevel } from "@/lib/xp";
import { ALL_LESSONS } from "@/content/study-lessons";
import { shopItems } from "@/data/shop";
import { AvatarDisplay } from "@/components/profile/AvatarDisplay";
import { cn, clamp100 } from "@/lib/utils";
import type { AvatarId } from "@/types";

const AVATARS: AvatarId[] = [
  "avatar_1", "avatar_2", "avatar_3", "avatar_4",
  "avatar_5", "avatar_6", "avatar_7", "avatar_8",
];

const WEEK_DAYS = ["M", "T", "W", "T", "F", "S", "S"];

type Rarity = "common" | "rare" | "epic" | "legendary";

const RARITY_MAP: Record<Rarity, { label: string; borderColor: string; glowColor: string; textColor: string; iconColor: string; bg: string }> = {
  common:    { label: "COMMON",    borderColor: "#4B5563", glowColor: "rgba(75,85,99,0.4)",     textColor: "#9CA3AF", iconColor: "#6B7280", bg: "#111115" },
  rare:      { label: "RARE",      borderColor: "#3B82F6", glowColor: "rgba(59,130,246,0.4)",   textColor: "#60A5FA", iconColor: "#3B82F6", bg: "#0D1525" },
  epic:      { label: "EPIC",      borderColor: "#B14EFF", glowColor: "rgba(177,78,255,0.4)",   textColor: "#C084FC", iconColor: "#B14EFF", bg: "#130D25" },
  legendary: { label: "LEGENDARY", borderColor: "#F59E0B", glowColor: "rgba(245,158,11,0.5)",   textColor: "#FCD34D", iconColor: "#F59E0B", bg: "#1A1205" },
};

// Inline styles injected via dangerouslySetInnerHTML for complex effects not achievable in Tailwind
const CYBERPUNK_STYLES = `
  .cp-glitch-hover:hover .cp-glitch-text {
    animation: cpGlitch 0.35s steps(1) forwards;
  }
  @keyframes cpGlitch {
    0%,100% { transform:translate(0); filter:none; clip-path:none; }
    20%      { transform:translate(-3px,0); filter:hue-rotate(90deg) saturate(2); clip-path:polygon(0 15%,100% 15%,100% 35%,0 35%); }
    40%      { transform:translate(3px,0);  filter:hue-rotate(-90deg) saturate(2); clip-path:polygon(0 55%,100% 55%,100% 75%,0 75%); }
    60%      { transform:translate(-1px,0); filter:none; clip-path:none; }
  }

  .cp-scanlines::after {
    content:'';
    position:absolute;
    inset:0;
    background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.025) 2px,rgba(0,0,0,0.025) 4px);
    pointer-events:none;
    z-index:50;
  }

  .cp-grain::before {
    content:'';
    position:absolute;
    inset:0;
    opacity:0.025;
    background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size:128px 128px;
    pointer-events:none;
    z-index:2;
  }

  .cp-grid-bg {
    background-image:
      linear-gradient(rgba(198,244,50,0.035) 1px,transparent 1px),
      linear-gradient(90deg,rgba(198,244,50,0.035) 1px,transparent 1px);
    background-size:40px 40px;
    animation:cpGridPan 24s linear infinite;
  }
  @keyframes cpGridPan {
    from { background-position:0 0; }
    to   { background-position:40px 40px; }
  }

  .cp-float { animation:cpFloat 4.5s ease-in-out infinite; }
  @keyframes cpFloat {
    0%,100% { transform:translateY(0) rotate(0deg); }
    33%     { transform:translateY(-7px) rotate(0.4deg); }
    66%     { transform:translateY(-3px) rotate(-0.25deg); }
  }

  .cp-blink { animation:cpBlink 1s step-end infinite; }
  @keyframes cpBlink { 0%,49%{opacity:1} 50%,100%{opacity:0} }

  .cp-pulse-dot { animation:cpPulseDot 2s ease-in-out infinite; }
  @keyframes cpPulseDot {
    0%,100% { box-shadow:0 0 0 0 rgba(198,244,50,0.8); transform:scale(1); }
    50%     { box-shadow:0 0 0 7px rgba(198,244,50,0); transform:scale(1.25); }
  }

  .cp-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .cp-card:hover {
    transform: perspective(700px) rotateX(-2deg) rotateY(1.5deg) translateY(-3px);
  }

  .cp-achievement { position:relative; }
  .cp-achievement-tip { display:none; pointer-events:none; }
  .cp-achievement:hover .cp-achievement-tip { display:block; }

  .cp-stagger > * { animation:cpStaggerIn 0.45s ease-out both; }
  .cp-stagger > *:nth-child(1){ animation-delay:0ms; }
  .cp-stagger > *:nth-child(2){ animation-delay:60ms; }
  .cp-stagger > *:nth-child(3){ animation-delay:120ms; }
  .cp-stagger > *:nth-child(4){ animation-delay:180ms; }
  .cp-stagger > *:nth-child(5){ animation-delay:240ms; }
  .cp-stagger > *:nth-child(6){ animation-delay:300ms; }
  .cp-stagger > *:nth-child(7){ animation-delay:360ms; }
  .cp-stagger > *:nth-child(8){ animation-delay:420ms; }
  .cp-stagger > *:nth-child(9){ animation-delay:480ms; }
  @keyframes cpStaggerIn {
    from { opacity:0; transform:translateY(14px); }
    to   { opacity:1; transform:translateY(0); }
  }

  .cp-btn-cta { transition: background 0.15s, color 0.15s; }
  .cp-btn-cta:hover { background: transparent !important; color: #C6F432 !important; }

  .cp-btn-secondary {
    transition: color 0.15s, border-color 0.15s;
  }
  .cp-btn-secondary:hover { color: #C6F432; border-color: rgba(198,244,50,0.4); }

  .cp-btn-logout { transition: color 0.15s, border-color 0.15s; }
  .cp-btn-logout:hover { color: #EF4444; border-color: rgba(239,68,68,0.5); }

  .cp-neon-avatar { box-shadow: 0 0 0 2px #C6F432, 0 0 20px rgba(198,244,50,0.35), 0 0 50px rgba(198,244,50,0.1); }

  .cp-shimmer {
    background: linear-gradient(90deg, #131318 25%, #1e1e24 50%, #131318 75%);
    background-size: 200% 100%;
    animation: cpShimmer 1.6s infinite;
  }
  @keyframes cpShimmer {
    from { background-position: -200% 0; }
    to   { background-position:  200% 0; }
  }
`;

export default function ProfilePage() {
  const user         = useUserStore((s) => s.user);
  const xp           = useUserStore((s) => s.xp);
  const streak       = useUserStore((s) => s.streak);
  const updateAvatar = useUserStore((s) => s.updateAvatar);
  const logout       = useUserStore((s) => s.logout);
  const { isLessonCompleted, getLesson } = useProgressStore();

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const level     = getLevelByXP(xp);
  const progress  = clamp100(getProgressToNextLevel(xp));
  const nextLevel = getNextLevel(xp);

  const completedLessons   = ALL_LESSONS.filter((l) => isLessonCompleted(l.slug)).length;
  const submittedHomeworks = ALL_LESSONS.filter((l) => getLesson(l.slug).homeworkStatus === "submitted").length;
  const totalLessons       = ALL_LESSONS.length;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      setMousePos({
        x: ((e.clientX - rect.left) / rect.width  - 0.5) * 30,
        y: ((e.clientY - rect.top)  / rect.height - 0.5) * 15,
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  if (!user) {
    return (
      <AppLayout wide>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="font-mono text-[#C6F432] text-sm animate-pulse tracking-widest">
            [ INITIALIZING PROFILE... ]
          </div>
        </div>
      </AppLayout>
    );
  }

  const equippedTitle = user.titleId ? shopItems.find((i) => i.id === user.titleId) : null;
  const equippedFrame = user.frameId ? shopItems.find((i) => i.id === user.frameId) : null;

  const achievements: {
    icon: string; label: string; desc: string;
    unlocked: boolean; rarity: Rarity;
    current: number; target: number;
  }[] = [
    { icon: "◎", label: "Первый шаг",    desc: "Пройди первый урок",       unlocked: completedLessons >= 1,  rarity: "common",    current: Math.min(completedLessons, 1),  target: 1   },
    { icon: "◈", label: "Книжный червь", desc: "Пройди 5 уроков",          unlocked: completedLessons >= 5,  rarity: "rare",      current: Math.min(completedLessons, 5),  target: 5   },
    { icon: "⬡", label: "Студент",       desc: "Пройди 10 уроков",         unlocked: completedLessons >= 10, rarity: "epic",      current: Math.min(completedLessons, 10), target: 10  },
    { icon: "◇", label: "Прилежный",     desc: "Сдай домашнее задание",    unlocked: submittedHomeworks >= 1, rarity: "common",   current: Math.min(submittedHomeworks, 1), target: 1  },
    { icon: "▲", label: "Огонёк",        desc: "3 дня подряд",             unlocked: streak >= 3,            rarity: "rare",      current: Math.min(streak, 3),            target: 3   },
    { icon: "◆", label: "Неделька",      desc: "7 дней подряд",            unlocked: streak >= 7,            rarity: "epic",      current: Math.min(streak, 7),            target: 7   },
    { icon: "⬟", label: "XP-охотник",   desc: "Набери 100 XP",            unlocked: xp >= 100,              rarity: "rare",      current: Math.min(xp, 100),              target: 100 },
    { icon: "✦", label: "Уровень II",    desc: "Достигни 2-го уровня",     unlocked: level.level >= 2,       rarity: "legendary", current: Math.min(level.level, 2),       target: 2   },
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  // Segmented XP bar — 10 cells, filled proportionally to level progress
  const XP_CELLS = 10;
  const xpCellsFilled = Math.round((progress / 100) * XP_CELLS);

  // Quest dots — use actual lesson count, min 9 for visual
  const QUEST_DOTS = Math.max(totalLessons, 9);

  const today = new Date().toLocaleDateString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

  return (
    <AppLayout wide>
      {/* Inject scoped animation CSS */}
      <style dangerouslySetInnerHTML={{ __html: CYBERPUNK_STYLES }} />

      <PageTransition>

        {/* ════════════════════════════════════════════════════════════════════
            FULL-PAGE DARK WRAPPER — extends to fill AppLayout padding
        ════════════════════════════════════════════════════════════════════ */}
        <div
          ref={containerRef}
          className="relative cp-grain cp-scanlines overflow-hidden"
          style={{
            margin: "-4px -32px -40px",
            padding: "0 32px 40px",
            minHeight: "100vh",
            background:
              "radial-gradient(ellipse 60% 40% at 20% 10%, rgba(177,78,255,0.07) 0%, transparent 60%)," +
              "radial-gradient(ellipse 50% 35% at 80% 85%, rgba(0,229,255,0.05) 0%, transparent 55%)," +
              "#08080A",
          }}
        >
          {/* Animated background grid */}
          <div
            className="cp-grid-bg absolute inset-0 pointer-events-none"
            style={{
              transform: `translate(${mousePos.x * 0.4}px, ${mousePos.y * 0.25}px)`,
              transition: "transform 0.12s ease-out",
            }}
          />

          {/* Decorative vertical edge lines (desktop) */}
          <div className="hidden xl:block absolute left-0 top-0 bottom-0 w-px pointer-events-none"
            style={{ background: "linear-gradient(to bottom, transparent 5%, rgba(198,244,50,0.15) 40%, transparent 95%)" }} />
          <div className="hidden xl:block absolute right-0 top-0 bottom-0 w-px pointer-events-none"
            style={{ background: "linear-gradient(to bottom, transparent 5%, rgba(198,244,50,0.15) 40%, transparent 95%)" }} />

          {/* ── Content — above overlays ─────────────────────────────────────── */}
          <div className="relative z-10 max-w-6xl mx-auto">

            {/* ════ HEADER ══════════════════════════════════════════════════════ */}
            <div className="flex items-center justify-between pt-6 pb-4">

              {/* Logo */}
              <div className="flex items-center gap-2.5">
                <span
                  className="cp-pulse-dot inline-block w-2 h-2 rounded-full bg-[#C6F432] flex-shrink-0"
                />
                <span className="font-mono text-[#C6F432] font-bold text-sm tracking-[0.2em]">
                  MIRROR // v0.1
                </span>
              </div>

              {/* Right: segmented energy bar + avatar */}
              <div className="flex items-center gap-4">
                {/* Segmented XP energy bar */}
                <div className="hidden sm:flex items-center gap-2">
                  <span className="font-mono text-[#C6F432]/40 text-[10px] tracking-widest">ENERGY</span>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: XP_CELLS }).map((_, i) => (
                      <div
                        key={i}
                        className="w-4 h-2.5 border transition-all duration-300"
                        style={{
                          borderColor: "rgba(198,244,50,0.25)",
                          background: i < xpCellsFilled ? "#C6F432" : "transparent",
                          boxShadow: i < xpCellsFilled ? "0 0 5px #C6F432" : "none",
                        }}
                      />
                    ))}
                  </div>
                  <span className="font-mono text-[#C6F432] text-xs font-bold">{xp} XP</span>
                </div>

                {/* Avatar with neon ring */}
                <div className="cp-neon-avatar rounded-xl overflow-hidden w-9 h-9 flex-shrink-0">
                  <AvatarDisplay avatarId={user.avatarId} size="sm" />
                </div>
              </div>
            </div>

            {/* Header separator — lime → transparent */}
            <div
              className="h-px mb-8"
              style={{ background: "linear-gradient(to right, #C6F432, rgba(198,244,50,0.25), transparent)" }}
            />

            {/* ════ HERO BLOCK ══════════════════════════════════════════════════ */}
            <div className="relative flex flex-col items-center text-center mb-10 py-6">

              {/* HUD corner brackets */}
              <span className="hidden md:block absolute top-0 left-0 font-mono text-[#C6F432]/25 text-2xl leading-tight select-none">⌐<br/>L</span>
              <span className="hidden md:block absolute top-0 right-0 font-mono text-[#C6F432]/25 text-2xl leading-tight text-right select-none">¬<br/>⌐</span>

              {/* Holographic floating avatar */}
              <div className="relative mb-7 cp-float">
                {/* Glow layers (chromatic aberration feel) */}
                <div className="absolute inset-0 rounded-2xl"
                  style={{ background: "radial-gradient(circle, rgba(177,78,255,0.5), transparent 70%)", filter: "blur(18px)", transform: "scale(1.3)" }} />
                <div className="absolute inset-0 rounded-2xl -translate-x-1"
                  style={{ background: "rgba(0,229,255,0.15)", filter: "blur(10px)", transform: "scale(1.15)" }} />
                <div className="cp-neon-avatar rounded-2xl overflow-hidden relative z-10">
                  <AvatarDisplay avatarId={user.avatarId} size="lg" frameId={equippedFrame?.id} />
                </div>
              </div>

              {/* Username — glitch on hover */}
              <div className="cp-glitch-hover cursor-default mb-3">
                <h1
                  className="cp-glitch-text font-mono font-black uppercase"
                  style={{
                    fontSize: "clamp(3rem, 8vw, 5.5rem)",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                    color: "#C6F432",
                    textShadow: "0 0 24px rgba(198,244,50,0.5), 0 0 80px rgba(198,244,50,0.12)",
                  }}
                >
                  {user.name}
                </h1>
              </div>

              {equippedTitle && (
                <p className="font-mono text-[#B14EFF] text-xs tracking-[0.2em] mb-3">
                  {equippedTitle.preview} {equippedTitle.name}
                </p>
              )}

              {/* Terminal date */}
              <div className="font-mono text-[#C6F432]/35 text-xs tracking-wider mb-4">
                {`[ INITIALIZED // ${today} ]`}
              </div>

              {/* Level row */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <div
                  className="font-mono text-[11px] px-3 py-1 border"
                  style={{ color: "#C6F432", borderColor: "rgba(198,244,50,0.3)", background: "rgba(198,244,50,0.05)" }}
                >
                  LVL {String(level.level).padStart(2, "0")}
                </div>
                <span className="font-mono text-[#C6F432]/30 text-xs">{"//"}</span>
                <span className="font-mono text-white/50 text-xs uppercase tracking-widest">{level.label}</span>
                {nextLevel && (
                  <>
                    <span className="font-mono text-[#C6F432]/30 text-xs">→</span>
                    <span className="font-mono text-[#B14EFF]/50 text-xs uppercase tracking-widest">{nextLevel.label}</span>
                  </>
                )}
              </div>
            </div>

            {/* ════ STATS CARDS ═════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 cp-stagger">

              {/* ── XP ── */}
              <div
                className="cp-card relative border p-5 overflow-hidden"
                style={{ background: "#0D0D10", borderColor: "rgba(198,244,50,0.18)", boxShadow: "0 0 24px rgba(198,244,50,0.04)" }}
              >
                <div className="absolute top-2 right-3 font-mono text-[9px] text-[#C6F432]/15 tracking-widest">XP</div>
                <div className="font-mono text-[#C6F432]/40 text-[10px] uppercase tracking-[0.2em] mb-1">ОПЫТ</div>
                <div
                  className="font-mono font-bold mb-4"
                  style={{ fontSize: 64, lineHeight: 1, color: "#C6F432", textShadow: "0 0 18px rgba(198,244,50,0.45)" }}
                >
                  {xp}
                </div>
                {/* Segmented level progress */}
                <div className="mb-2">
                  <div className="flex justify-between font-mono text-[10px] text-[#C6F432]/35 mb-1.5">
                    <span>LVL {String(level.level).padStart(2, "0")} → {String(level.level + 1).padStart(2, "0")}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 h-1.5 transition-all duration-500"
                        style={{
                          background: i < Math.round(progress / 5) ? "#C6F432" : "rgba(198,244,50,0.08)",
                          boxShadow: i < Math.round(progress / 5) ? "0 0 4px #C6F432" : "none",
                        }}
                      />
                    ))}
                  </div>
                </div>
                {nextLevel && (
                  <div className="font-mono text-[9px] text-[#C6F432]/25">
                    {nextLevel.minXP - xp} XP до следующего уровня
                  </div>
                )}
              </div>

              {/* ── Quests ── */}
              <div
                className="cp-card relative border p-5 overflow-hidden"
                style={{ background: "#0D0D10", borderColor: "rgba(0,229,255,0.18)", boxShadow: "0 0 24px rgba(0,229,255,0.04)" }}
              >
                <div className="absolute top-2 right-3 font-mono text-[9px] text-[#00E5FF]/15 tracking-widest">QST</div>
                <div className="font-mono text-[#00E5FF]/40 text-[10px] uppercase tracking-[0.2em] mb-1">КВЕСТЫ</div>
                <div
                  className="font-mono font-bold mb-4"
                  style={{ fontSize: 64, lineHeight: 1, color: "#00E5FF", textShadow: "0 0 18px rgba(0,229,255,0.45)" }}
                >
                  {completedLessons}
                </div>
                {/* Dot grid */}
                <div
                  className="grid mb-2"
                  style={{ gridTemplateColumns: `repeat(${Math.min(QUEST_DOTS, 9)}, 1fr)`, gap: 4 }}
                >
                  {Array.from({ length: Math.min(QUEST_DOTS, 9) }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-[1px] transition-all duration-500"
                      style={{
                        background: i < completedLessons ? "#00E5FF" : "rgba(0,229,255,0.08)",
                        boxShadow:  i < completedLessons ? "0 0 5px #00E5FF" : "none",
                      }}
                    />
                  ))}
                </div>
                <div className="font-mono text-[9px] text-[#00E5FF]/25">
                  {completedLessons} / {totalLessons} ЗАВЕРШЕНО
                </div>
              </div>

              {/* ── Streak ── */}
              <div
                className="cp-card relative border p-5 overflow-hidden"
                style={{ background: "#0D0D10", borderColor: "rgba(251,146,60,0.22)", boxShadow: "0 0 24px rgba(251,146,60,0.04)" }}
              >
                <div className="absolute top-2 right-3 font-mono text-[9px] text-orange-400/15 tracking-widest">STK</div>
                <div className="font-mono text-orange-400/40 text-[10px] uppercase tracking-[0.2em] mb-1">СТРИК</div>
                <div
                  className="font-mono font-bold mb-4"
                  style={{ fontSize: 64, lineHeight: 1, color: "#FB923C", textShadow: "0 0 18px rgba(251,146,60,0.45)" }}
                >
                  {streak}
                </div>
                {/* Day squares */}
                <div className="flex gap-1 mb-2">
                  {WEEK_DAYS.map((day, i) => {
                    const active = streak >= 7 || i < (streak % 7 || (streak > 0 ? 7 : 0));
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full transition-all duration-500"
                          style={{
                            aspectRatio: "1",
                            background: active ? "#FB923C" : "rgba(251,146,60,0.08)",
                            boxShadow:  active ? "0 0 6px #FB923C" : "none",
                          }}
                        />
                        <span className="font-mono text-[8px] text-orange-400/30">{day}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="font-mono text-[9px] text-orange-400/25">
                  {streak >= 7 ? "НЕДЕЛЬНАЯ СЕРИЯ 🔥" : streak > 0 ? `ещё ${7 - streak % 7} дн до недели` : "НАЧНИ СЕРИЮ"}
                </div>
              </div>

            </div>

            {/* ════ ACHIEVEMENTS ════════════════════════════════════════════════ */}
            <div
              className="border p-5 md:p-6 mb-5"
              style={{ background: "#09090C", borderColor: "rgba(198,244,50,0.08)" }}
            >
              <div className="flex items-center justify-between mb-5">
                <span className="font-mono text-white text-sm font-bold tracking-[0.15em]">{"// ДОСТИЖЕНИЯ"}</span>
                <span className="font-mono text-[#C6F432]/40 text-xs tracking-widest">
                  [ {unlockedCount} / {achievements.length} UNLOCKED ]
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 cp-stagger">
                {achievements.map(({ icon, label, desc, unlocked, rarity, current, target }) => {
                  const r = RARITY_MAP[rarity];
                  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
                  const inProgress = !unlocked && current > 0;
                  return (
                    <div
                      key={label}
                      className={cn("cp-card cp-achievement border p-3 transition-all duration-200 cursor-default", !unlocked && !inProgress && "opacity-35")}
                      style={{
                        background: unlocked ? r.bg : "#0D0D10",
                        borderColor: unlocked ? r.borderColor : inProgress ? "rgba(198,244,50,0.2)" : "#1E1E25",
                        boxShadow: unlocked ? `0 0 14px ${r.glowColor}` : "none",
                      }}
                    >
                      {/* Rarity tag */}
                      <div className="font-mono text-[8px] uppercase tracking-widest mb-2" style={{ color: unlocked ? r.textColor : "#3A3A45" }}>
                        {r.label}
                      </div>

                      {/* Icon */}
                      <div
                        className="text-2xl mb-2 leading-none"
                        style={{
                          color: unlocked ? r.iconColor : "#3A3A45",
                          filter: unlocked ? `drop-shadow(0 0 6px ${r.iconColor})` : "none",
                          fontFamily: "monospace",
                        }}
                      >
                        {icon}
                      </div>

                      {/* Label */}
                      <p className="font-mono text-[10px] font-bold leading-tight mb-2" style={{ color: unlocked ? "#E5E7EB" : "#3A3A45" }}>
                        {label}
                      </p>

                      {/* State indicator */}
                      {unlocked ? (
                        <div className="flex items-center gap-1">
                          <div className="h-0.5 flex-1 rounded-full" style={{ background: r.iconColor, boxShadow: `0 0 4px ${r.iconColor}` }} />
                          <span className="font-mono text-[8px]" style={{ color: r.textColor }}>✓</span>
                        </div>
                      ) : inProgress ? (
                        <div>
                          <div className="h-0.5 w-full rounded-full overflow-hidden" style={{ background: "rgba(198,244,50,0.1)" }}>
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: "#C6F432" }} />
                          </div>
                          <span className="font-mono text-[8px] text-[#C6F432]/40">{current}/{target}</span>
                        </div>
                      ) : (
                        <div className="h-0.5 w-full rounded-full" style={{ background: "#1A1A22" }} />
                      )}

                      {/* Hover tooltip */}
                      <div className="cp-achievement-tip absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 w-36">
                        <div
                          className="font-mono text-[10px] p-2 border text-white/60 text-center"
                          style={{ background: "#0D0D10", borderColor: "rgba(198,244,50,0.18)" }}
                        >
                          {desc}
                          {unlocked && <div className="text-[#C6F432]/50 mt-0.5">ПОЛУЧЕНО ✓</div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ════ AVATAR + QUEST HISTORY ══════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">

              {/* Avatar selector */}
              <div
                className="border p-5"
                style={{ background: "#09090C", borderColor: "rgba(177,78,255,0.12)" }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="font-mono text-white text-sm font-bold tracking-[0.15em]">{"// АВАТАР"}</span>
                  <span className="cp-blink font-mono text-[#C6F432] text-sm">_</span>
                </div>
                <div className="grid grid-cols-4 gap-3 place-items-center">
                  {AVATARS.map((avatarId) => (
                    <button
                      key={avatarId}
                      onClick={() => updateAvatar(avatarId)}
                      aria-label={`Выбрать аватар ${avatarId}`}
                      className="transition-all duration-200 focus:outline-none rounded-xl overflow-hidden"
                      style={
                        user.avatarId === avatarId
                          ? { boxShadow: "0 0 0 2px #C6F432, 0 0 14px rgba(198,244,50,0.4)", transform: "scale(1.06)" }
                          : { opacity: 0.35 }
                      }
                      onMouseEnter={(e) => { if (user.avatarId !== avatarId) e.currentTarget.style.opacity = "0.8"; }}
                      onMouseLeave={(e) => { if (user.avatarId !== avatarId) e.currentTarget.style.opacity = "0.35"; }}
                    >
                      <AvatarDisplay avatarId={avatarId} size="md" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Quest history — terminal empty state */}
              <div
                className="border p-5 flex flex-col"
                style={{ background: "#09090C", borderColor: "rgba(0,229,255,0.1)" }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="font-mono text-white text-sm font-bold tracking-[0.15em]">{"// ИСТОРИЯ КВЕСТОВ"}</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center py-4 text-center">
                  <pre
                    className="font-mono text-[10px] text-left mb-4 select-none"
                    style={{ color: "rgba(0,229,255,0.15)", lineHeight: 1.6 }}
                  >{`╔══════════════════╗
║   QUEST_LOG      ║
║   [ EMPTY ]      ║
║   > cursor_      ║
╚══════════════════╝`}</pre>
                  <p className="font-mono text-[11px] text-[#C6F432]/40 mb-1">
                    {">"} no_quests.found()
                  </p>
                  <p className="font-mono text-[10px] text-white/15 mb-5">
                    {"// начни первый квест, чтобы записать историю"}
                  </p>
                  <button
                    className="cp-btn-cta font-mono text-[11px] font-bold px-4 py-2 uppercase tracking-widest border"
                    style={{ background: "#C6F432", color: "#08080A", borderColor: "#C6F432" }}
                  >
                    [ ОТКРЫТЬ КАТАЛОГ КВЕСТОВ → ]
                  </button>
                </div>
              </div>

            </div>

            {/* ════ FOOTER ══════════════════════════════════════════════════════ */}
            <div
              className="h-px mb-5"
              style={{ background: "linear-gradient(to right, transparent, rgba(198,244,50,0.15), transparent)" }}
            />
            <div className="flex items-center justify-between pb-10">

              {/* Secondary actions */}
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { label: "Настройки", icon: "⚙" },
                  { label: "Поделиться", icon: "◎" },
                  { label: "Экспорт",   icon: "↗" },
                ].map(({ label, icon }) => (
                  <button
                    key={label}
                    className="cp-btn-secondary font-mono text-[11px] px-3 py-1.5 border text-white/30 tracking-wider"
                    style={{ borderColor: "rgba(255,255,255,0.07)", background: "transparent" }}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>

              {/* Logout — secondary outline */}
              <button
                className="cp-btn-logout font-mono text-[11px] px-3 py-1.5 border text-red-400/30 tracking-wider"
                style={{ borderColor: "rgba(239,68,68,0.15)", background: "transparent" }}
                onClick={logout}
              >
                ← ВЫЙТИ
              </button>
            </div>

          </div>
        </div>

      </PageTransition>
    </AppLayout>
  );
}
