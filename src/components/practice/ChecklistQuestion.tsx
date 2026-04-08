"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { Question } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  question: Question;
  onAnswer: (correct: boolean) => void;
}

export function ChecklistQuestion({ question, onAnswer }: Props) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setChecked(new Set());
    setSubmitted(false);
  }, [question.id]);

  const toggle = (id: string) => {
    if (submitted) return;
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    setSubmitted(true);
    // Checklist is always "correct" — it's self-assessment
    onAnswer(true);
  };

  const score = checked.size;
  const total = question.options.length;

  return (
    <div>
      <div className="flex flex-col gap-2 mb-5">
        {question.options.map((opt, idx) => {
          const isChecked = checked.has(opt.id);
          return (
            <motion.button
              key={opt.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              onClick={() => toggle(opt.id)}
              disabled={submitted}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 text-left transition-all",
                submitted
                  ? isChecked
                    ? "bg-success/8 border-success text-text"
                    : "bg-gray-50 border-border text-text-muted"
                  : isChecked
                  ? "bg-primary-light border-primary text-text"
                  : "bg-white border-border hover:border-primary/40 text-text"
              )}
            >
              <span className={cn(
                "w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                submitted
                  ? isChecked
                    ? "bg-success border-success"
                    : "bg-white border-border"
                  : isChecked
                  ? "bg-primary border-primary"
                  : "bg-white border-border"
              )}>
                {isChecked && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-white text-xs font-black"
                  >
                    ✓
                  </motion.span>
                )}
              </span>
              <span className="text-sm font-medium leading-snug">{opt.text}</span>
            </motion.button>
          );
        })}
      </div>

      {!submitted ? (
        <button
          onClick={handleSubmit}
          className="w-full py-3 rounded-xl bg-primary text-white text-sm font-black hover:bg-primary-hover transition-all"
        >
          Готово — я проверил{checked.size > 0 ? ` (${checked.size}/${total})` : ""}
        </button>
      ) : (
        <div className="rounded-xl p-4 border bg-success/8 border-success/20">
          <div className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-full bg-success/15 text-success flex items-center justify-center text-sm font-black shrink-0 mt-0.5">
              ✓
            </span>
            <div>
              <p className="font-bold text-sm text-success mb-1">
                Самопроверка завершена — {score} из {total}
              </p>
              <p className="text-text-muted text-sm leading-relaxed">
                {score === total
                  ? "Всё сделано правильно. Отличный старт! 🚀"
                  : score >= 6
                  ? "Почти всё готово. Вернись к пропущенным пунктам — они важны для следующего урока."
                  : "Похоже, часть шагов была пропущена. Это нормально для первого раза. Вернись к гайду и попробуй снова."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
