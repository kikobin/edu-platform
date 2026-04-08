"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Question } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  question: Question;
  onAnswer: (correct: boolean) => void;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function OrderingQuestion({ question, onAnswer }: Props) {
  const [items, setItems]       = useState(() => shuffle(question.options));
  const [ordered, setOrdered]   = useState<string[]>([]);
  const [checked, setChecked]   = useState(false);
  const [isCorrect, setCorrect] = useState(false);

  // Сброс при смене вопроса
  useEffect(() => {
    setItems(shuffle(question.options));
    setOrdered([]);
    setChecked(false);
    setCorrect(false);
  }, [question.id, question.options]);

  const remaining = items.filter((i) => !ordered.includes(i.id));

  const addToOrder = (id: string) => {
    if (checked || ordered.length >= question.options.length) return;
    setOrdered((prev) => [...prev, id]);
  };

  const removeFromOrder = (id: string) => {
    if (checked) return;
    setOrdered((prev) => prev.filter((x) => x !== id));
  };

  const handleCheck = () => {
    const ok = ordered.every((id, i) => id === question.correctIds[i]) &&
      ordered.length === question.correctIds.length;
    setChecked(true);
    setCorrect(ok);
    onAnswer(ok);
  };

  const handleReset = () => {
    setOrdered([]);
    setChecked(false);
    setCorrect(false);
  };

  return (
    <div>
      {/* Зона порядка */}
      <div className="mb-5">
        <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">
          Твой порядок
        </p>
        <div className="flex flex-col gap-2 min-h-[56px]">
          {/* Режим результата — без AnimatePresence чтобы не конфликтовать с exit-анимацией родителя */}
          {checked
            ? ordered.map((id, idx) => {
                const item = question.options.find((o) => o.id === id)!;
                const correctAtPos = question.correctIds[idx] === id;
                return (
                  <div
                    key={id}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 text-left",
                      correctAtPos
                        ? "bg-success/10 border-success"
                        : "bg-error/10 border-error"
                    )}
                  >
                    <span className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black shrink-0",
                      correctAtPos ? "bg-success/20 text-success" : "bg-error/20 text-error"
                    )}>
                      {correctAtPos ? "✓" : "✗"}
                    </span>
                    <span className={cn(
                      "text-sm font-medium",
                      correctAtPos ? "text-success" : "text-error"
                    )}>
                      {item.text}
                    </span>
                  </div>
                );
              })
            : (
              <AnimatePresence>
                {ordered.map((id, idx) => {
                  const item = question.options.find((o) => o.id === id)!;
                  return (
                    <motion.button
                      key={id}
                      layout
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16 }}
                      onClick={() => removeFromOrder(id)}
                      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 text-left transition-all bg-primary-light border-primary/30 hover:border-primary"
                    >
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black shrink-0 bg-primary text-white">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-text">{item.text}</span>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            )
          }

          {ordered.length === 0 && !checked && (
            <div className="border-2 border-dashed border-border rounded-xl px-4 py-4 text-center">
              <p className="text-sm text-text-muted">Нажимай на шаги снизу, чтобы выстроить порядок</p>
            </div>
          )}
        </div>
      </div>

      {/* Оставшиеся элементы */}
      {!checked && remaining.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">
            Доступные шаги
          </p>
          <div className="flex flex-col gap-2">
            {remaining.map((item) => (
              <motion.button
                key={item.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => addToOrder(item.id)}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 border-border bg-white hover:border-primary/40 hover:bg-primary-light/20 text-left transition-all active:scale-[0.98]"
              >
                <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-bold text-text-muted shrink-0">
                  ?
                </span>
                <span className="text-sm font-medium text-text">{item.text}</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Кнопки */}
      {!checked ? (
        <div className="flex gap-3">
          {ordered.length > 0 && (
            <button
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl border border-border text-text-muted text-sm font-semibold hover:bg-gray-50 transition-all shrink-0"
            >
              Сбросить
            </button>
          )}
          <button
            onClick={handleCheck}
            disabled={ordered.length !== question.options.length}
            className={cn(
              "flex-1 py-3 rounded-xl text-sm font-black transition-all",
              ordered.length === question.options.length
                ? "bg-primary text-white hover:bg-primary-hover"
                : "bg-gray-100 text-text-muted cursor-not-allowed"
            )}
          >
            {ordered.length === question.options.length
              ? "Проверить порядок"
              : `Расставь все ${question.options.length} шагов`}
          </button>
        </div>
      ) : (
        <div className={cn(
          "rounded-xl p-4 border",
          isCorrect ? "bg-success/8 border-success/20" : "bg-error/8 border-error/20"
        )}>
          <div className="flex items-start gap-3">
            <span className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-sm font-black shrink-0 mt-0.5",
              isCorrect ? "bg-success/15 text-success" : "bg-error/15 text-error"
            )}>
              {isCorrect ? "✓" : "✗"}
            </span>
            <div>
              <p className={cn("font-bold text-sm mb-1", isCorrect ? "text-success" : "text-error")}>
                {isCorrect ? "Правильный порядок!" : "Не совсем"}
              </p>
              <p className="text-text-muted text-sm leading-relaxed">{question.explanation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
