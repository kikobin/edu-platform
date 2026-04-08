"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { useProgressStore } from "@/store/progressStore";
import { contentRepository } from "@/lib/contentRepository";
import { lessons } from "@/data/lessons";
import { cn } from "@/lib/utils";

interface Props { params: { id: string } }
type Phase = "quiz" | "passed" | "failed";

const DEFAULT_MIN_PASS = 80; // %

export default function CheckpointPage({ params }: Props) {
  const { id }  = params;
  const router  = useRouter();
  const { getLesson, markStepDone, isStepUnlocked } = useProgressStore();

  const questions = useMemo(() => contentRepository.getQuestions(id), [id]);
  const lesson    = useMemo(() => lessons.find((l) => l.id === id), [id]);
  const stepDef   = lesson?.steps.find((s) => s.id === "checkpoint");
  const minPass   = stepDef?.minPassScore ?? DEFAULT_MIN_PASS;
  const alreadyDone = getLesson(id).steps["checkpoint"]?.done ?? false;

  const [current,  setCurrent]  = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [correct,  setCorrect]  = useState(0);
  const [phase,    setPhase]    = useState<Phase>(alreadyDone ? "passed" : "quiz");
  const [attempts, setAttempts] = useState(0);

  if (!isStepUnlocked(id, "checkpoint")) {
    return (
      <AppLayout>
        <div className="p-8 text-center">
          <p className="text-text-muted">Этот шаг ещё не открыт</p>
          <Button className="mt-4" onClick={() => router.push(`/lesson/${id}`)}>← Назад</Button>
        </div>
      </AppLayout>
    );
  }

  const q = questions[current];

  function handleSelect(optId: string) {
    if (!q) return;
    if (q.type === "single" || q.type === "truefalse") {
      setSelected([optId]);
    } else {
      setSelected((prev) =>
        prev.includes(optId) ? prev.filter((x) => x !== optId) : [...prev, optId]
      );
    }
  }

  function handleConfirm() {
    if (!q) return;
    const isCorrect = [...q.correctIds].sort().join(",") === [...selected].sort().join(",");
    const newCorrect = correct + (isCorrect ? 1 : 0);

    if (current + 1 < questions.length) {
      setCorrect(newCorrect);
      setCurrent((c) => c + 1);
      setSelected([]);
    } else {
      // Quiz finished
      const score = Math.round(((newCorrect) / questions.length) * 100);
      setAttempts((a) => a + 1);
      if (score >= minPass) {
        markStepDone(id, "checkpoint", score);
        setPhase("passed");
      } else {
        setPhase("failed");
        setCorrect(0);
        setCurrent(0);
        setSelected([]);
      }
    }
  }

  if (phase === "passed") {
    const score = Math.round((correct / Math.max(questions.length, 1)) * 100);
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto px-4 pt-12 pb-10 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-2xl font-black text-text mb-2">Контрольная точка пройдена!</h1>
          <p className="text-text-muted text-sm mb-6">
            {alreadyDone
              ? "Этот контрольный рубеж уже засчитан."
              : `Результат: ${score}% — выше порога ${minPass}%.`}
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={() => router.push(`/lesson/${id}`)}>
              ← К уроку
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (phase === "failed") {
    const lastScore = Math.round((correct / Math.max(questions.length, 1)) * 100);
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto px-4 pt-12 pb-10 text-center">
          <div className="text-6xl mb-4">😅</div>
          <h1 className="text-2xl font-black text-text mb-2">Попробуй ещё раз</h1>
          <p className="text-text-muted text-sm mb-2">
            Результат: <span className="font-bold text-red-500">{lastScore}%</span>
          </p>
          <p className="text-text-muted text-sm mb-6">
            Для прохождения нужно набрать не менее <span className="font-bold">{minPass}%</span>
            {attempts > 1 && ` (попыток: ${attempts})`}
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={() => router.push(`/lesson/${id}`)}>
              ← К уроку
            </Button>
            <Button variant="primary" onClick={() => setPhase("quiz")}>
              Начать заново →
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!q) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-text-muted">Вопросы не найдены для этого урока.</div>
      </AppLayout>
    );
  }

  const progress = Math.round((current / questions.length) * 100);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push(`/lesson/${id}`)}
            className="text-text-muted hover:text-text text-sm flex items-center gap-1"
          >
            ← Назад
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
              🔒 Контрольная точка
            </span>
            <span className="text-xs text-text-muted">{current + 1} / {questions.length}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Minimum score notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-5 flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <p className="text-xs text-amber-700 font-medium">
            Нужно набрать не менее <span className="font-black">{minPass}%</span> правильных ответов.
            При ошибке придётся начать сначала.
          </p>
        </div>

        {/* Question card */}
        <div className="bg-white rounded-3xl border border-border shadow-card p-6 mb-5">
          <p className="font-black text-text text-lg leading-snug mb-5">{q.text}</p>

          <div className="space-y-2.5">
            {q.options.map((opt) => {
              const isSelected = selected.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  className={cn(
                    "w-full text-left px-4 py-3.5 rounded-2xl border-2 transition-all text-sm font-medium",
                    isSelected
                      ? "border-amber-400 bg-amber-50 text-amber-800"
                      : "border-gray-100 bg-gray-50 text-text hover:border-gray-200 hover:bg-white"
                  )}
                >
                  {opt.text}
                </button>
              );
            })}
          </div>
        </div>

        <Button
          variant="primary"
          fullWidth
          disabled={selected.length === 0}
          onClick={handleConfirm}
        >
          {current + 1 < questions.length ? "Следующий вопрос →" : "Завершить проверку →"}
        </Button>
      </div>
    </AppLayout>
  );
}
