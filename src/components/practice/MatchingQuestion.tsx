"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { Question } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  question: Question;
  onAnswer: (correct: boolean) => void;
}

export function MatchingQuestion({ question, onAnswer }: Props) {
  const [selected, setSelected] = useState<string | null>(null); // left id
  const [matches, setMatches] = useState<Record<string, string>>({}); // leftId → rightId
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    setSelected(null);
    setMatches({});
    setChecked(false);
    setIsCorrect(false);
  }, [question.id]);

  const pairs = question.pairs ?? [];
  const matchedRightIds = Object.values(matches);

  const handleLeft = (id: string) => {
    if (checked) return;
    setSelected((prev) => (prev === id ? null : id));
  };

  const handleRight = (rightId: string) => {
    if (checked || !selected) return;
    setMatches((prev) => {
      const next = { ...prev };
      // Remove previous match for this right item
      const existingLeft = Object.keys(next).find((k) => next[k] === rightId);
      if (existingLeft) delete next[existingLeft];
      next[selected] = rightId;
      return next;
    });
    setSelected(null);
  };

  const handleCheck = () => {
    const ok = question.correctIds.every((pair) => {
      const sep = pair.indexOf(":");
      const leftId  = pair.slice(0, sep);
      const rightId = pair.slice(sep + 1);
      return matches[leftId] === rightId;
    });
    setChecked(true);
    setIsCorrect(ok);
    onAnswer(ok);
  };

  const handleReset = () => {
    setSelected(null);
    setMatches({});
    setChecked(false);
    setIsCorrect(false);
  };

  const getMatchResult = (leftId: string) => {
    if (!checked) return null;
    const correctPair = question.correctIds.find((p) => p.startsWith(leftId + ":"));
    const correctRightId = correctPair?.split(":")[1];
    return matches[leftId] === correctRightId;
  };

  const allMatched = question.options.length > 0 &&
    Object.keys(matches).length === question.options.length;

  return (
    <div>
      {!checked ? (
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* Left column */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">
              Шаги
            </p>
            {question.options.map((opt) => {
              const isSelected = selected === opt.id;
              const isMatched = opt.id in matches;
              const matchedPair = pairs.find((p) => p.id === matches[opt.id]);
              return (
                <motion.button
                  key={opt.id}
                  onClick={() => handleLeft(opt.id)}
                  className={cn(
                    "w-full px-3 py-2.5 rounded-xl border-2 text-left text-sm font-medium transition-all",
                    isSelected
                      ? "bg-primary/10 border-primary text-primary"
                      : isMatched
                      ? "bg-primary-light border-primary/40 text-text"
                      : "bg-white border-border hover:border-primary/40 text-text"
                  )}
                >
                  <span className="block leading-snug">{opt.text}</span>
                  {isMatched && matchedPair && (
                    <span className="block text-xs text-primary mt-1 font-normal truncate">
                      → {matchedPair.text}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">
              Цели
            </p>
            {pairs.map((pair) => {
              const isUsed = matchedRightIds.includes(pair.id);
              return (
                <motion.button
                  key={pair.id}
                  onClick={() => handleRight(pair.id)}
                  disabled={isUsed && !selected}
                  className={cn(
                    "w-full px-3 py-2.5 rounded-xl border-2 text-left text-sm font-medium transition-all",
                    isUsed
                      ? "bg-gray-50 border-border/50 text-text-muted cursor-default"
                      : selected
                      ? "bg-accent/10 border-accent/50 hover:border-accent text-text cursor-pointer"
                      : "bg-white border-border text-text-muted"
                  )}
                >
                  <span className="leading-snug">{pair.text}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Results view */
        <div className="flex flex-col gap-2 mb-5">
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">
            Результат
          </p>
          {question.options.map((opt) => {
            const correct = getMatchResult(opt.id);
            const matchedPair = pairs.find((p) => p.id === matches[opt.id]);
            const correctPairId = question.correctIds
              .find((p) => p.startsWith(opt.id + ":"))
              ?.split(":")[1];
            const correctPair = pairs.find((p) => p.id === correctPairId);
            return (
              <div
                key={opt.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 rounded-xl border-2",
                  correct
                    ? "bg-success/8 border-success"
                    : "bg-error/8 border-error"
                )}
              >
                <span className={cn(
                  "w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 mt-0.5",
                  correct ? "bg-success/15 text-success" : "bg-error/15 text-error"
                )}>
                  {correct ? "✓" : "✗"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text leading-snug">{opt.text}</p>
                  {!correct && matchedPair && (
                    <p className="text-xs text-error mt-0.5">Ты выбрал: {matchedPair.text}</p>
                  )}
                  {!correct && correctPair && (
                    <p className="text-xs text-success mt-0.5">Правильно: {correctPair.text}</p>
                  )}
                  {correct && matchedPair && (
                    <p className="text-xs text-success mt-0.5">→ {matchedPair.text}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && !checked && (
        <p className="text-xs text-primary font-semibold mb-3 text-center animate-pulse">
          Теперь выбери цель справа →
        </p>
      )}

      {!checked ? (
        <div className="flex gap-3">
          {Object.keys(matches).length > 0 && (
            <button
              onClick={handleReset}
              className="px-4 py-2.5 rounded-xl border border-border text-text-muted text-sm font-semibold hover:bg-gray-50 transition-all shrink-0"
            >
              Сбросить
            </button>
          )}
          <button
            onClick={handleCheck}
            disabled={!allMatched}
            className={cn(
              "flex-1 py-3 rounded-xl text-sm font-black transition-all",
              allMatched
                ? "bg-primary text-white hover:bg-primary-hover"
                : "bg-gray-100 text-text-muted cursor-not-allowed"
            )}
          >
            {allMatched ? "Проверить" : `Соедини все ${question.options.length} пар`}
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
                {isCorrect ? "Все пары верны!" : "Есть ошибки"}
              </p>
              <p className="text-text-muted text-sm leading-relaxed">{question.explanation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
