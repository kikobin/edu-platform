"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { useProgressStore } from "@/store/progressStore";
import { useUserStore } from "@/store/userStore";
import { contentRepository } from "@/lib/contentRepository";
import { lessons } from "@/data/lessons";
import { getLessonFinishContent } from "@/data/lessonFinish";
import { XP_REWARDS } from "@/types";
import { formatDeadline, isDeadlinePassed, cn } from "@/lib/utils";

const EXAMPLES = [
  "Добавить раздел с фотографиями",
  "Изменить цвет кнопки",
  "Добавить новую страницу",
  "Поправить текст на главной",
  "Добавить список с топ-5",
  "Сделать красивее шапку",
];

const STEPS_META = [
  { key: "review",   label: "Повторение",         icon: "📖" },
  { key: "practice", label: "Закрепление",         icon: "✏️" },
  { key: "homework", label: "Домашнее задание",    icon: "📝" },
] as const;

interface Props { params: { id: string } }

export default function HomeworkPage({ params }: Props) {
  const { id } = params;
  const router  = useRouter();
  const { getLesson, markHomeworkSubmitted, resetHomework, isLessonUnlocked, isStepUnlocked } = useProgressStore();
  const addXP     = useUserStore((s) => s.addXP);
  const showToast = useUserStore((s) => s.showToast);
  const user      = useUserStore((s) => s.user);

  const hw           = contentRepository.getHomework(id);
  const progress     = getLesson(id);
  const finishContent = getLessonFinishContent(id);
  const hwStatus     = progress.homeworkStatus;
  const done         = hwStatus === "submitted" || hwStatus === "approved" || hwStatus === "revision";

  const DRAFT_KEY = `edu_hw_draft_${id}`;

  const [checked,    setChecked]    = useState<string[]>([]);
  const [hintOpen,   setHintOpen]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [linkValue,  setLinkValue]  = useState("");
  const [submissionInfo, setSubmissionInfo] = useState<{
    status: string;
    curatorComment?: string;
  } | null>(null);

  // Restore draft from localStorage on first mount (only when not already submitted)
  useEffect(() => {
    if (done) return;
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const draft = JSON.parse(saved) as { checked?: string[]; linkValue?: string };
        if (Array.isArray(draft.checked)) setChecked(draft.checked);
        if (typeof draft.linkValue === "string") setLinkValue(draft.linkValue);
      }
    } catch { /* ignore corrupt draft */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist draft whenever checklist or link changes
  useEffect(() => {
    if (done) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ checked, linkValue }));
    } catch { /* ignore quota errors */ }
  }, [checked, linkValue, done, DRAFT_KEY]);

  useEffect(() => {
    fetch(`/api/submissions?lessonId=${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setSubmissionInfo(data); })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!isLessonUnlocked(id)) { router.replace("/dashboard"); return; }
    if (!isStepUnlocked(id, "homework")) {
      showToast("Сначала закрепление", "Домашка откроется после завершения практики.");
      router.replace(`/lesson/${id}`);
    }
  }, [id, isLessonUnlocked, isStepUnlocked, router, showToast]);

  if (!hw) {
    return (
      <AppLayout hideNav>
        <div className="min-h-screen bg-[#F6F5FF] flex items-center justify-center p-8">
          <div className="text-center">
            <span className="text-5xl mb-4 block">📋</span>
            <p className="font-bold text-text">Домашнее задание не добавлено</p>
            <p className="text-sm text-text-muted mt-1">Преподаватель скоро добавит задание</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!isLessonUnlocked(id) || !isStepUnlocked(id, "homework")) return null;

  const deadlinePassed = hw.deadline ? isDeadlinePassed(hw.deadline) : false;
  const allChecked     = hw.checklist.length > 0 && checked.length === hw.checklist.length;
  const uploadItem     = hw.checklist[hw.checklist.length - 1];
  const hasChecklist   = hw.checklist.length > 0 && Boolean(uploadItem);
  const mainChecklist  = hw.checklist.slice(0, -1);
  const completedCount = checked.length;
  const progressPct    = hw.checklist.length > 0 ? Math.round((completedCount / hw.checklist.length) * 100) : 0;
  const xpTotal        = XP_REWARDS.HOMEWORK_DONE + (!deadlinePassed ? XP_REWARDS.HOMEWORK_ON_TIME : 0);

  const stepStatus = {
    review:   progress.reviewDone,
    practice: progress.practiceDone,
    homework: progress.homeworkStatus === "submitted",
  };

  const toggleCheck = (itemId: string) => {
    if (done) return;
    setChecked((prev) => prev.includes(itemId) ? prev.filter((x) => x !== itemId) : [...prev, itemId]);
  };

  const handleSubmit = async () => {
    if (!allChecked || submitting) return;
    if (hw?.submitType === "link" && !linkValue.trim()) return;
    setSubmitting(true);

    // Fire-and-forget to Supabase via API
    if (hw && user) {
      const lesson = lessons.find((l) => l.id === id);
      fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: id,
          homeworkId: hw.id,
          lessonTitle: lesson?.title ?? id,
          homeworkTitle: hw.title,
          content: linkValue.trim() || hw.title,
          submitType: hw.submitType,
          userName: user.name,
        }),
      }).catch(() => {});
    }

    await new Promise((r) => setTimeout(r, 600));
    const awarded = markHomeworkSubmitted(id);
    if (awarded) {
      // sourceId prevents double-award if page is re-mounted or sync triggers a re-emit
      addXP(XP_REWARDS.HOMEWORK_DONE, `step:${id}:homework`);
      if (!deadlinePassed) addXP(XP_REWARDS.HOMEWORK_ON_TIME, `step:${id}:homework:ontime`);
    }
    // Clear saved draft now that submission is sent
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    setSubmitting(false);
  };

  const handleRestart = () => {
    resetHomework(id);
    setChecked([]);
    setLinkValue("");
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    showToast("Домашка перезапущена", "Чеклист очищен, можно пройти шаг заново.");
  };

  // ── Экран результата (submitted / approved / revision) ──────────────────────
  if (done) {
    const isApproved = hwStatus === "approved";
    const isRevision = hwStatus === "revision";
    const curatorComment = submissionInfo?.curatorComment;

    return (
      <AppLayout hideNav>
        <div className="min-h-screen bg-[#F6F5FF]">
          <div className="max-w-5xl mx-auto px-4 md:px-8 pt-4 pb-8">
            <div className="flex items-center gap-3 mb-8">
              <Link href={`/lesson/${id}`} className="flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-text transition-colors px-3 py-2 rounded-xl hover:bg-white">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Назад к уроку
              </Link>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "bg-white rounded-3xl border shadow-sm p-8 md:p-10 text-center",
                    isApproved ? "border-green-200" : isRevision ? "border-red-200" : "border-purple-100/80"
                  )}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
                    className={cn(
                      "w-24 h-24 rounded-[28px] flex items-center justify-center text-5xl mb-6 mx-auto",
                      isApproved ? "bg-green-50 border border-green-200" :
                      isRevision ? "bg-red-50 border border-red-200" :
                      "bg-[linear-gradient(135deg,rgba(181,237,24,0.25),rgba(181,237,24,0.08))] border border-accent/20"
                    )}
                  >
                    {isApproved ? "✅" : isRevision ? "✏️" : "🎉"}
                  </motion.div>

                  {isApproved && (
                    <>
                      <h2 className="text-3xl font-black text-green-700 mb-2 tracking-tight">Принято!</h2>
                      <p className="text-text-muted text-base mb-4">Куратор проверил и одобрил твою работу.</p>
                      {curatorComment && (
                        <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-6 py-4 text-left">
                          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-green-600 mb-1.5">💬 Комментарий куратора</p>
                          <p className="text-sm font-semibold text-green-800 leading-relaxed">{curatorComment}</p>
                        </div>
                      )}
                      <Button fullWidth size="lg" onClick={() => router.push("/dashboard")}>На главную →</Button>
                    </>
                  )}

                  {isRevision && (
                    <>
                      <h2 className="text-3xl font-black text-red-600 mb-2 tracking-tight">На доработку</h2>
                      <p className="text-text-muted text-base mb-4">Куратор оставил комментарий — исправь и сдай снова.</p>
                      {curatorComment && (
                        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-left">
                          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-red-500 mb-1.5">💬 Комментарий куратора</p>
                          <p className="text-sm font-semibold text-red-700 leading-relaxed">{curatorComment}</p>
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button fullWidth size="lg" variant="secondary" onClick={handleRestart}>Сдать заново</Button>
                        <Button fullWidth size="lg" onClick={() => router.push(`/lesson/${id}`)}>К уроку</Button>
                      </div>
                    </>
                  )}

                  {!isApproved && !isRevision && (
                    <>
                      <h2 className="text-3xl font-black text-text mb-2 tracking-tight">Сдано!</h2>
                      <p className="text-text-muted text-base mb-4">{finishContent.homeworkSubtitle}</p>
                      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-left flex items-center gap-3">
                        <span className="text-2xl">⏳</span>
                        <div>
                          <p className="text-sm font-bold text-amber-700">Ожидает проверки куратора</p>
                          <p className="text-xs text-amber-600 mt-0.5">Следующий урок откроется после одобрения</p>
                        </div>
                      </div>
                      {finishContent.homeworkSummaryText && (
                        <div className="mb-6 rounded-2xl border border-primary/15 bg-[linear-gradient(135deg,rgba(104,91,199,0.07),rgba(181,237,24,0.07))] px-6 py-5 text-left">
                          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-primary/70 mb-1.5">
                            {finishContent.homeworkSummaryTitle ?? "Уже сделано"}
                          </p>
                          <p className="text-sm font-semibold text-text leading-relaxed">{finishContent.homeworkSummaryText}</p>
                        </div>
                      )}
                      <Button fullWidth size="lg" onClick={() => router.push(`/lesson/${id}`)}>{finishContent.homeworkReturnCta}</Button>
                    </>
                  )}
                </motion.div>
              </div>
              <div className="flex flex-col gap-4">
                <div className="bg-[#1A1A2E] rounded-3xl p-6 relative overflow-hidden">
                  <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
                  <div className="relative z-10">
                    <p className="text-white/40 text-[11px] font-bold uppercase tracking-[0.18em] mb-3">Получено XP</p>
                    <div className="flex items-end gap-2">
                      <span className="text-5xl font-black text-accent leading-none">+{xpTotal}</span>
                      <span className="text-white/40 text-lg font-bold mb-1">XP</span>
                    </div>
                    {!deadlinePassed && (
                      <div className="mt-4 bg-white/8 rounded-2xl px-4 py-3 border border-white/8">
                        <p className="text-white/60 text-xs">✓ Включая бонус за своевременность</p>
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

  // ── Основной экран ──────────────────────────────────────────────────────────
  return (
    <AppLayout hideNav>
      <div className="min-h-screen bg-[#F6F5FF]">
        <div className="max-w-5xl mx-auto px-4 md:px-8 pt-4 pb-8">

          {/* ── Шапка ── */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link
                href={`/lesson/${id}`}
                className="flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-text transition-colors px-3 py-2 rounded-xl hover:bg-white"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Назад
              </Link>
              <div className="h-4 w-px bg-gray-200" />
              <div>
                <p className="text-xs text-text-muted font-medium">Шаг 3 из 3</p>
                <h1 className="text-lg font-black text-text leading-tight">Домашнее задание</h1>
              </div>
            </div>
            {hw.deadline && (
              <div className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold border",
                deadlinePassed
                  ? "bg-red-50 text-red-500 border-red-100"
                  : "bg-primary-light text-primary border-primary/20"
              )}>
                {deadlinePassed ? "Просрочено" : `До ${formatDeadline(hw.deadline)}`}
              </div>
            )}
          </div>

          {/* ── Шаги урока ── */}
          <div className="flex items-center gap-1.5 mb-5">
            {STEPS_META.map((step, i) => {
              const isDone    = stepStatus[step.key];
              const isCurrent = step.key === "homework";
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
                    {isCurrent && !isDone && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse shrink-0" />}
                  </div>
                  {i < 2 && <div className={cn("w-4 h-px shrink-0", isDone ? "bg-success/40" : "bg-gray-200")} />}
                </div>
              );
            })}
          </div>

          {/* ── Основная сетка ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Главный контент */}
            <div className="lg:col-span-2 flex flex-col gap-5">

              {/* Карточка задания */}
              <div className="bg-white rounded-3xl border border-purple-100/80 shadow-sm overflow-hidden">
                <div className="h-1 bg-[linear-gradient(90deg,#685BC7_0%,#B5ED18_100%)]" />
                <div className="p-6 md:p-8">
                  <h2 className="text-2xl font-black text-text mb-3 tracking-tight">{hw.title}</h2>
                  <p className="text-text-muted leading-relaxed text-[15px]">{hw.description}</p>
                  {hasChecklist && (
                    <div className="mt-6">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-text-muted mb-3">
                        {finishContent.homeworkExamplesTitle}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {EXAMPLES.map((ex) => (
                          <span key={ex} className="px-3.5 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-primary text-xs font-semibold">
                            {ex}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Комментарий куратора (если статус revision) */}
              {submissionInfo?.status === "revision" && submissionInfo.curatorComment && (
                <div className="bg-amber-50 rounded-3xl border border-amber-200 p-5 flex gap-3">
                  <span className="text-xl shrink-0">💬</span>
                  <div>
                    <p className="text-sm font-bold text-amber-800 mb-1">Комментарий куратора</p>
                    <p className="text-sm text-amber-700 leading-relaxed">{submissionInfo.curatorComment}</p>
                  </div>
                </div>
              )}

              {/* Чеклист */}
              {hasChecklist && (
                <div className="bg-white rounded-3xl border border-purple-100/80 shadow-sm p-6 md:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-black text-text">Шаги выполнения</h3>
                    <div className="flex items-center gap-2.5">
                      <div className="h-2 w-28 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#685BC7,#B5ED18)]"
                          animate={{ width: `${progressPct}%` }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                        />
                      </div>
                      <span className="text-sm font-black text-primary tabular-nums">
                        {completedCount}<span className="text-text-muted font-semibold">/{hw.checklist.length}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 mb-5">
                    {mainChecklist.map((item, i) => {
                      const isChecked = checked.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => toggleCheck(item.id)}
                          className={cn(
                            "group flex items-center gap-4 text-left w-full px-4 py-4 rounded-2xl border-2 transition-all duration-200",
                            isChecked
                              ? "bg-success/5 border-success/25"
                              : "bg-gray-50/80 border-gray-100 hover:border-primary/25 hover:bg-purple-50/40"
                          )}
                        >
                          <div className={cn(
                            "w-7 h-7 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all",
                            isChecked ? "bg-success border-success" : "bg-white border-gray-300 group-hover:border-primary/50"
                          )}>
                            {isChecked && (
                              <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                              </motion.svg>
                            )}
                          </div>
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className={cn(
                              "w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0",
                              isChecked ? "bg-success/12 text-success" : "bg-white border border-gray-200 text-text-muted"
                            )}>
                              {i + 1}
                            </span>
                            <span className={cn(
                              "text-sm font-medium leading-snug",
                              isChecked ? "line-through text-text-muted" : "text-text"
                            )}>
                              {item.text}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-text-muted whitespace-nowrap">Обязательный шаг</span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>

                  <button
                    onClick={() => toggleCheck(uploadItem!.id)}
                    className={cn(
                      "group flex items-center gap-4 w-full text-left px-4 py-4 rounded-2xl border-2 transition-all duration-200 mb-8",
                      checked.includes(uploadItem!.id)
                        ? "bg-accent/8 border-accent/35"
                        : "bg-[#f7ffe6] border-accent/20 hover:border-accent/45 hover:bg-accent/8"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all",
                      checked.includes(uploadItem!.id) ? "bg-accent border-accent" : "bg-white border-accent/40 group-hover:border-accent/70"
                    )}>
                      {checked.includes(uploadItem!.id) && (
                        <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2.5 7L5.5 10L11.5 4" stroke="#1A1A2E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </motion.svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        "text-sm font-bold leading-snug block",
                        checked.includes(uploadItem!.id) ? "line-through text-text-muted" : "text-text"
                      )}>
                        {hw.checklist.length}. {uploadItem!.text}
                      </span>
                      {!checked.includes(uploadItem!.id) && (
                        <span className="text-xs text-[#7aaa0a] font-semibold mt-0.5 block">Обязательно для сдачи</span>
                      )}
                    </div>
                    <span className="text-xl shrink-0">⚡</span>
                  </button>

                  {allChecked && hw.submitType === "link" && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4"
                    >
                      <label className="block text-xs font-bold text-text-muted uppercase tracking-[0.12em] mb-2">
                        Ссылка на результат
                      </label>
                      <input
                        type="url"
                        value={linkValue}
                        onChange={(e) => setLinkValue(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl bg-white outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                      />
                    </motion.div>
                  )}

                  <AnimatePresence mode="wait">
                    {allChecked ? (
                      <motion.div key="submit" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <Button
                          fullWidth
                          size="lg"
                          variant="accent"
                          loading={submitting}
                          disabled={hw.submitType === "link" && !linkValue.trim()}
                          onClick={handleSubmit}
                        >
                          Сдать домашку ⚡
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div key="disabled" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Button fullWidth size="lg" disabled>
                          Отметь все шаги ({completedCount}/{hw.checklist.length})
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Боковая панель */}
            <div className="flex flex-col gap-4">

              {/* XP */}
              <div className="bg-[#1A1A2E] rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-36 h-36 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute left-0 bottom-0 w-24 h-24 bg-accent/10 rounded-full blur-xl pointer-events-none" />
                <div className="relative z-10">
                  <p className="text-white/40 text-[11px] font-bold uppercase tracking-[0.18em] mb-3">Награда за сдачу</p>
                  <div className="flex items-end gap-2 mb-1">
                    <span className="text-5xl font-black text-accent leading-none">+{XP_REWARDS.HOMEWORK_DONE}</span>
                    <span className="text-white/40 text-xl font-bold mb-1">XP</span>
                  </div>
                  {!deadlinePassed && (
                    <div className="mt-4 bg-white/8 rounded-2xl px-4 py-3 border border-white/8 flex items-center gap-3">
                      <span className="text-accent text-lg">⚡</span>
                      <div>
                        <p className="text-white text-xs font-bold">+{XP_REWARDS.HOMEWORK_ON_TIME} XP бонус</p>
                        <p className="text-white/40 text-[11px]">За своевременность</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Подсказка */}
              <div className="bg-white rounded-3xl border border-purple-100/80 shadow-sm overflow-hidden">
                <button
                  onClick={() => setHintOpen((p) => !p)}
                  className="flex items-center gap-3 w-full px-5 py-4 text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center text-base shrink-0">💡</div>
                  <p className="font-bold text-text text-sm flex-1">Подсказка</p>
                  <motion.span animate={{ rotate: hintOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-text-muted text-xs">▾</motion.span>
                </button>
                <AnimatePresence>
                  {hintOpen && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 border-t border-gray-50 space-y-4 pt-4">
                        <div>
                          <p className="text-xs font-bold text-text mb-1.5">Если не знаешь с чего начать:</p>
                          <p className="text-xs text-text-muted leading-relaxed">{finishContent.homeworkHintStart}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-text mb-1.5">Если Codex не понимает:</p>
                          <p className="text-xs text-text-muted leading-relaxed">{finishContent.homeworkHintCodex}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Прогресс урока */}
              <div className="bg-white rounded-3xl border border-purple-100/80 shadow-sm p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-text-muted mb-4">Прогресс урока</p>
                <div className="flex flex-col gap-2">
                  {STEPS_META.map((step, i) => {
                    const isDone    = stepStatus[step.key];
                    const isCurrent = step.key === "homework";
                    return (
                      <div key={step.key} className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors",
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
                        {isCurrent && !isDone && (
                          <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">Сейчас</span>
                        )}
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
