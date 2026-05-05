"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useStepDone } from "../useStepDone";
import { useUserStore } from "@/store/userStore";
import { getSavedPrompt } from "@/lib/promptStore";
import { CheckIcon, CopyIcon, AlertIcon, InfoIcon } from "@/components/brand/Icon";
import type { SendPromptContent } from "@/types/study";

interface Props {
  lessonSlug: string;
  stepKey: string;
  content: SendPromptContent;
  videoId?: string;
}

/**
 * Like ActionStep but also shows the prompt the student assembled in an
 * earlier PromptBuilder step (looked up via promptKey) and provides a
 * one-click copy button.
 */
export function SendPrompt({ lessonSlug, stepKey, content, videoId }: Props) {
  const { isDone, markDone } = useStepDone(lessonSlug, stepKey);
  const userId = useUserStore((s) => s.user?.id ?? null);
  const showToast = useUserStore((s) => s.showToast);

  const [savedPrompt, setSavedPrompt] = useState<string | null>(null);
  useEffect(() => {
    setSavedPrompt(getSavedPrompt(userId, lessonSlug, content.promptKey));
  }, [userId, lessonSlug, content.promptKey]);

  const onCopy = async () => {
    if (!savedPrompt) return;
    try {
      await navigator.clipboard.writeText(savedPrompt);
      showToast("Скопировано", "Промт в буфере. Вставь в Codex.");
    } catch {
      showToast("Не удалось скопировать", "Скопируй вручную.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {videoId && (
        <div>
          <div className="aspect-video rounded-xl overflow-hidden bg-dark border border-border">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0&start=${content.videoStartSeconds}`}
              title={content.checkboxLabel}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full block"
            />
          </div>
        </div>
      )}

      {savedPrompt ? (
        <div className="bg-white rounded-xl border border-border p-6 md:p-7">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              {content.promptTitle ?? "Твой промт"}
            </p>
            <button
              onClick={onCopy}
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:text-primary-hover px-2.5 py-1 rounded-md hover:bg-primary/8 transition-colors"
            >
              <CopyIcon size={14} /> Скопировать
            </button>
          </div>
          <pre className="text-[13px] text-text whitespace-pre-wrap font-sans bg-bg p-4 rounded-lg leading-relaxed border border-border">
            {savedPrompt}
          </pre>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-[13px] text-amber-800 flex gap-2.5 items-start">
          <AlertIcon size={16} className="shrink-0 mt-0.5" />
          <span>Сначала собери промт на шаге {content.sourceStepNumber} — он подгрузится сюда автоматически.</span>
        </div>
      )}

      {content.instructions.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-6 md:p-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted mb-4">
            Что сделать
          </p>
          <ol className="flex flex-col gap-3">
            {content.instructions.map((it, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-md bg-primary/10 text-primary text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-[14px] text-text leading-relaxed flex-1">{it}</p>
              </li>
            ))}
          </ol>
          {content.note && (
            <div className="mt-5 px-4 py-3 rounded-lg bg-primary/6 border border-primary/15 text-[13px] text-primary leading-relaxed flex gap-2.5 items-start">
              <InfoIcon size={16} className="shrink-0 mt-0.5" />
              <span>{content.note}</span>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => !isDone && markDone()}
        disabled={isDone}
        className={cn(
          "w-full px-6 py-4 rounded-lg border transition-colors flex items-center justify-center gap-3 text-[14px] font-semibold",
          isDone
            ? "bg-success/10 border-success/30 text-success cursor-default"
            : "bg-white border-border text-text hover:border-primary/40 hover:bg-primary/4"
        )}
      >
        <span
          className={cn(
            "w-5 h-5 rounded-md border flex items-center justify-center",
            isDone ? "bg-success border-success text-white" : "bg-white border-text-muted/40"
          )}
        >
          {isDone && <CheckIcon size={14} />}
        </span>
        {isDone ? content.doneLabel ?? "Сделано" : content.checkboxLabel}
      </button>
    </div>
  );
}
