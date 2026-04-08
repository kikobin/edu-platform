"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { OrderingQuestion } from "@/components/practice/OrderingQuestion";
import { MatchingQuestion } from "@/components/practice/MatchingQuestion";
import { ChecklistQuestion } from "@/components/practice/ChecklistQuestion";
import { useProgressStore } from "@/store/progressStore";
import { useUserStore } from "@/store/userStore";
import { contentRepository } from "@/lib/contentRepository";
import { getLessonFinishContent } from "@/data/lessonFinish";
import { XP_REWARDS } from "@/types";
import { cn } from "@/lib/utils";

interface Props { params: { id: string } }
type AnswerState = "idle" | "correct" | "wrong";
const DELEGATED_TYPES = ["ordering", "matching", "checklist"] as const;

const STEPS_META = [
  { key: "review",   label: "Повторение",       icon: "📖" },
  { key: "practice", label: "Закрепление",       icon: "✏️" },
  { key: "homework", label: "Домашнее задание",  icon: "📝" },
] as const;

export default function PracticePage({ params }: Props) {
  const { id }  = params;
  const router  = useRouter();
  const { getLesson, markPracticeDone, isLessonUnlocked, isStepUnlocked } = useProgressStore();
  const showToast = useUserStore((s) => s.showToast);

  const questions = useMemo(() => contentRepository.getQuestions(id), [id]);
  const savedProgress = getLesson(id);
  const finishContent = getLessonFinishContent(id);

  const [current,           setCurrent]           = useState(0);
  const [selected,          setSelected]          = useState<string[]>([]);
  const [state,             setState]             = useState<AnswerState>("idle");
  const [correctCount,      setCorrectCount]      = useState(0);
  const [done,              setDone]              = useState(savedProgress.practiceDone);
  const [delegatedAnswered, setDelegatedAnswered] = useState(false);
  const [delegatedCorrect,  setDelegatedCorrect]  = useState(false);
  const finishing = useRef(false);

  useEffect(() => {
    if (!isLessonUnlocked(id)) { router.replace("/dashboard"); return; }
    if (!isStepUnlocked(id, "practice")) {
      showToast("Сначала повторение", "Этот шаг откроется после просмотра слайдов.");
      router.replace(`/lesson/${id}`);
    }
  }, [id, isLessonUnlocked, isStepUnlocked, router, showToast]);

  if (!questions.length) {
    return (
      <AppLayout hideNav>
        <div className="min-h-screen bg-[#F6F5FF] flex items-center justify-center p-8">
          <div className="text-center">
            <span className="text-5xl mb-4 block">✏️</span>
            <p className="font-bold text-text">Вопросы ещё не добавлены</p>
            <p className="text-sm text-text-muted mt-1">Преподаватель скоро добавит задания</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!isLessonUnlocked(id) || !isStepUnlocked(id, "practice")) return null;

  const q     = questions[current];
  const total = questions.length;
  if (!q) return null;

  const isMultiple  = q.type === "multiple";
  const isDelegated = (DELEGATED_TYPES as readonly string[]).includes(q.type);

  const stepStatus = {
    review:   savedProgress.reviewDone,
    practice: savedProgress.practiceDone,
    homework: savedProgress.homeworkStatus === "submitted",
  };

  const toggleOption = (optId: string) => {
    if (state !== "idle") return;
    if (isMultiple) {
      setSelected((p) => p.includes(optId) ? p.filter((x) => x !== optId) : [...p, optId]);
    } else {
      setSelected([optId]);
    }
  };

  const handleCheck = () => {
    if (!selected.length || state !== "idle") return;
    const ok = selected.length === q.correctIds.length && selected.every((s) => q.correctIds.includes(s));
    setState(ok ? "correct" : "wrong");
    if (ok) setCorrectCount((c) => c + 1);
  };

  const handleDelegatedAnswer = (correct: boolean) => {
    setDelegatedAnswered(true);
    setDelegatedCorrect(correct);
    if (correct) setCorrectCount((c) => c + 1);
  };

  const advanceOrFinish = () => {
    if (current < total - 1) {
      setCurrent((c) => c + 1);
      setSelected([]);
      setState("idle");
      setDelegatedAnswered(false);
      setDelegatedCorrect(false);
    } else {
      if (finishing.current) return;
      finishing.current = true;
      const finalScore = total > 0 ? Math.round((correctCount / total) * 100) : 0;
      markPracticeDone(id, finalScore); // emits lesson:step:completed → useLessonEvents awards XP + bonus
      setDone(true);
    }
  };

  // ── Финал ───────────────────────────────────────────────────────────────────
  if (done) {
    const finalScore = correctCount > 0 ? Math.round((correctCount / total) * 100) : savedProgress.practiceScore;
    const isPerfect  = finalScore >= 80;

    return (
      <AppLayout hideNav>
        <div className="min-h-screen bg-[#F6F5FF]">
          <div className="max-w-5xl mx-auto px-4 md:px-8 pt-4 pb-8">
            <div className="flex items-center gap-3 mb-4">
              <Link href={`/lesson/${id}`} className="flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-text transition-colors px-3 py-2 rounded-xl hover:bg-white">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Назад к уроку
              </Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-3xl border border-purple-100/80 shadow-sm p-8 md:p-10 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
                    className={cn(
                      "w-24 h-24 rounded-[28px] flex items-center justify-center text-5xl mb-6 mx-auto",
                      isPerfect ? "bg-accent/15 border border-accent/20" : "bg-primary-light border border-primary/15"
                    )}
                  >
                    {isPerfect ? "🌟" : "💪"}
                  </motion.div>
                  <h2 className="text-3xl font-black text-text mb-2 tracking-tight">
                    {isPerfect ? "Отлично!" : "Неплохо!"}
                  </h2>
                  <p className="text-text-muted text-base mb-8">
                    {correctCount > 0 ? `${correctCount} из ${total} правильных` : "Результат сохранён"}
                  </p>

                  {finishContent.practiceSummaryText && (
                    <div className="mb-6 rounded-2xl border border-primary/15 bg-[linear-gradient(135deg,rgba(104,91,199,0.07),rgba(181,237,24,0.07))] px-6 py-5 text-left">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary/70 mb-1.5">
                        {finishContent.practiceSummaryTitle ?? "Что уже умеешь"}
                      </p>
                      <p className="text-sm font-semibold text-text leading-relaxed">{finishContent.practiceSummaryText}</p>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-left">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-text-muted">Результат</span>
                      <span className={cn("text-3xl font-black", isPerfect ? "text-success" : "text-primary")}>{finalScore}%</span>
                    </div>
                    <div className="w-full bg-white rounded-full h-3 overflow-hidden border border-gray-100">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${finalScore}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                        className={cn("h-full rounded-full", isPerfect ? "bg-success" : "bg-primary")}
                      />
                    </div>
                  </div>

                  <Button fullWidth size="lg" onClick={() => router.push(`/lesson/${id}`)}>
                    {finishContent.practiceCta}
                  </Button>
                </motion.div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="bg-[#1A1A2E] rounded-3xl p-6 relative overflow-hidden">
                  <div className="absolute -right-8 -top-8 w-36 h-36 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
                  <div className="relative z-10">
                    <p className="text-white/40 text-[11px] font-bold uppercase tracking-[0.18em] mb-3">Получено XP</p>
                    <div className="flex items-end gap-2">
                      <span className="text-5xl font-black text-accent leading-none">+{XP_REWARDS.PRACTICE_DONE}{isPerfect ? `+${XP_REWARDS.PRACTICE_BONUS}` : ""}</span>
                    </div>
                    <p className="text-white/40 text-sm mt-1">XP заработано</p>
                    {isPerfect && (
                      <div className="mt-4 bg-white/8 rounded-2xl px-4 py-3 border border-white/8">
                        <p className="text-white/60 text-xs">✓ Бонус за отличный результат!</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── Вопрос ─────────────────────────────────────────────────────────────────
  const canAdvanceDelegated = isDelegated && delegatedAnswered;
  const progressPct = Math.round(((current + (state !== "idle" || delegatedAnswered ? 1 : 0)) / total) * 100);

  return (
    <AppLayout hideNav>
      <div className="min-h-screen bg-[#F6F5FF]">
        <div className="max-w-5xl mx-auto px-4 md:px-8 pt-4 pb-8">

          {/* ── Шапка ── */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link href={`/lesson/${id}`} className="flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-text transition-colors px-3 py-2 rounded-xl hover:bg-white">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Назад
              </Link>
              <div className="h-4 w-px bg-gray-200" />
              <div>
                <p className="text-xs text-text-muted font-medium">Шаг 2 из 3</p>
                <h1 className="text-lg font-black text-text leading-tight">Закрепление</h1>
              </div>
            </div>
            <span className="text-sm font-black text-text-muted tabular-nums bg-white px-3 py-1.5 rounded-xl border border-gray-100">
              {current + 1} <span className="text-text-subtle font-medium">/ {total}</span>
            </span>
          </div>

          {/* ── Шаги урока ── */}
          <div className="flex items-center gap-1.5 mb-5">
            {STEPS_META.map((step, i) => {
              const isDone    = stepStatus[step.key];
              const isCurrent = step.key === "practice";
              return (
                <div key={step.key} className="flex items-center gap-1.5 flex-1">
                  <div className={cn(
                    "flex items-center gap-2 flex-1 px-3 py-2 rounded-xl border text-xs font-bold transition-all",
                    isDone    ? "bg-success/8 border-success/25 text-success"
                    : isCurrent ? "bg-white border-primary/30 text-primary shadow-sm"
                    : "bg-white/50 border-gray-200 text-text-muted"
                  )}>
                    <span className="text-sm leading-none">{isDone ? "✓" : step.icon}</span>
                    <span className="hidden sm:block truncate">{step.label}</span>
                    {isCurrent && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />}
                  </div>
                  {i < 2 && <div className={cn("w-4 h-px shrink-0", isDone ? "bg-success/40" : "bg-gray-200")} />}
                </div>
              );
            })}
          </div>

          {/* ── Основная сетка ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Вопрос + ответы */}
            <div className="lg:col-span-2 flex flex-col gap-4">

              {/* Вопрос */}
              <div className="bg-white rounded-3xl border border-purple-100/80 shadow-sm overflow-hidden">
                <div className="h-1 bg-[linear-gradient(90deg,#685BC7_0%,#B5ED18_100%)]" />
                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-bold text-text-muted bg-gray-50 px-2.5 py-1 rounded-lg">
                      Вопрос {current + 1}
                    </span>
                    {q.type === "truefalse" && (
                      <span className="text-xs font-bold text-primary bg-primary-light px-2.5 py-1 rounded-lg">
                        Правда или миф
                      </span>
                    )}
                    {isMultiple && (
                      <span className="text-xs font-bold text-primary bg-primary-light px-2.5 py-1 rounded-lg">
                        Несколько правильных
                      </span>
                    )}
                  </div>
                  <p className="text-xl font-bold text-text leading-snug">{q.text}</p>
                </div>
              </div>

              {/* Делегированные типы */}
              {q.type === "ordering"  && <OrderingQuestion question={q} onAnswer={handleDelegatedAnswer} />}
              {q.type === "matching"  && <MatchingQuestion question={q} onAnswer={handleDelegatedAnswer} />}
              {q.type === "checklist" && <ChecklistQuestion question={q} onAnswer={handleDelegatedAnswer} />}

              {/* Классические типы */}
              {!isDelegated && (
                <>
                  <div className="flex flex-col gap-3">
                    {q.options.map((opt, i) => {
                      const isSelected   = selected.includes(opt.id);
                      const isCorrectOpt = q.correctIds.includes(opt.id);
                      const revealed     = state !== "idle";
                      const letter       = String.fromCharCode(65 + i);

                      let cls = "";
                      if (!revealed) {
                        cls = isSelected
                          ? "bg-primary border-primary text-white"
                          : "bg-white border-gray-200 text-text hover:border-primary/35 hover:bg-purple-50/40";
                      } else {
                        if (isCorrectOpt) cls = "bg-success/8 border-success/40 text-text";
                        else if (isSelected) cls = "bg-red-50 border-red-200 text-text";
                        else cls = "bg-white border-gray-100 text-text-muted opacity-50";
                      }

                      return (
                        <button
                          key={opt.id}
                          onClick={() => toggleOption(opt.id)}
                          disabled={revealed}
                          className={cn(
                            "group w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all duration-200 active:scale-[0.99]",
                            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                            cls
                          )}
                        >
                          <span className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 transition-colors",
                            !revealed && isSelected   ? "bg-white/25 text-white"
                            : !revealed               ? "bg-gray-100 text-text-muted group-hover:bg-primary-light group-hover:text-primary"
                            : isCorrectOpt            ? "bg-success/15 text-success"
                            : isSelected              ? "bg-red-100 text-red-500"
                            : "bg-gray-100 text-text-muted"
                          )}>
                            {revealed && isCorrectOpt ? "✓" : revealed && isSelected && !isCorrectOpt ? "✗" : letter}
                          </span>
                          <span className="font-medium leading-snug">{opt.text}</span>
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence>
                    {state !== "idle" && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -8, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className={cn(
                          "rounded-2xl p-5 border",
                          state === "correct" ? "bg-success/6 border-success/20" : "bg-red-50 border-red-100"
                        )}>
                          <div className="flex items-start gap-3">
                            <span className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shrink-0",
                              state === "correct" ? "bg-success/15 text-success" : "bg-red-100 text-red-500"
                            )}>
                              {state === "correct" ? "✓" : "✗"}
                            </span>
                            <div>
                              <p className={cn("font-bold text-sm mb-1", state === "correct" ? "text-success" : "text-red-500")}>
                                {state === "correct" ? "Правильно!" : "Не совсем"}
                              </p>
                              <p className="text-text-muted text-sm leading-relaxed">{q.explanation}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-3">
                    {state === "idle" ? (
                      <Button fullWidth size="lg" onClick={handleCheck} disabled={!selected.length}>
                        Проверить
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        size="lg"
                        variant={current < total - 1 ? "primary" : "accent"}
                        onClick={advanceOrFinish}
                      >
                        {current < total - 1 ? "Следующий →" : "Завершить ✓"}
                      </Button>
                    )}
                  </div>
                </>
              )}

              {isDelegated && canAdvanceDelegated && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <Button
                    fullWidth
                    size="lg"
                    variant={current < total - 1 ? "primary" : "accent"}
                    onClick={advanceOrFinish}
                  >
                    {current < total - 1 ? "Следующий →" : "Завершить ✓"}
                  </Button>
                </motion.div>
              )}
            </div>

            {/* Боковая панель */}
            <div className="flex flex-col gap-4">

              {/* Прогресс-карточка */}
              <div className="bg-white rounded-3xl border border-purple-100/80 shadow-sm p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-text-muted mb-4">Прогресс</p>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-text-muted">Вопрос</span>
                  <span className="text-2xl font-black text-primary tabular-nums">{current + 1}<span className="text-text-muted text-base font-semibold">/{total}</span></span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden mb-4">
                  <motion.div
                    className="h-full rounded-full bg-[linear-gradient(90deg,#685BC7,#B5ED18)]"
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                {/* Точки вопросов */}
                <div className="flex flex-wrap gap-1.5">
                  {questions.map((_, i) => (
                    <div key={i} className={cn(
                      "w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black transition-all",
                      i < current   ? "bg-success/15 text-success"
                      : i === current ? "bg-primary text-white"
                      : "bg-gray-100 text-text-muted"
                    )}>
                      {i < current ? "✓" : i + 1}
                    </div>
                  ))}
                </div>
              </div>

              {/* Счёт */}
              <div className="bg-[#1A1A2E] rounded-3xl p-5 relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-28 h-28 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10">
                  <p className="text-white/40 text-[11px] font-bold uppercase tracking-[0.18em] mb-3">Правильных ответов</p>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black text-white leading-none">{correctCount}</span>
                    <span className="text-white/30 text-lg font-bold mb-0.5">/ {current}</span>
                  </div>
                  <div className="mt-4 bg-white/8 rounded-xl px-3 py-2 flex items-center gap-2">
                    <span className="text-accent text-sm">⚡</span>
                    <p className="text-white/60 text-xs">
                      +{XP_REWARDS.PRACTICE_DONE} XP за тест
                      {current > 0 && correctCount / current >= 0.8
                        ? ` +${XP_REWARDS.PRACTICE_BONUS} бонус`
                        : ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Прогресс урока */}
              <div className="bg-white rounded-3xl border border-purple-100/80 shadow-sm p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-text-muted mb-4">Прогресс урока</p>
                <div className="flex flex-col gap-2">
                  {STEPS_META.map((step, i) => {
                    const isDone    = stepStatus[step.key];
                    const isCurrent = step.key === "practice";
                    return (
                      <div key={step.key} className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl",
                        isCurrent ? "bg-primary-light" : isDone ? "bg-success/6" : "bg-gray-50"
                      )}>
                        <div className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0",
                          isDone ? "bg-success/15 text-success" : isCurrent ? "bg-primary text-white" : "bg-gray-200 text-text-muted"
                        )}>
                          {isDone ? "✓" : i + 1}
                        </div>
                        <p className={cn(
                          "text-xs font-semibold flex-1",
                          isCurrent ? "text-primary font-bold" : isDone ? "text-success" : "text-text-muted"
                        )}>
                          {step.label}
                        </p>
                        {isCurrent && <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">Сейчас</span>}
                        {isDone && <span className="text-success text-xs">✓</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
