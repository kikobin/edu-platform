"use client";

import { cn } from "@/lib/utils";
import { useStepDone } from "../useStepDone";
import { CheckIcon, InfoIcon } from "@/components/brand/Icon";
import type { ActionStepContent } from "@/types/study";

interface Props {
  lessonSlug: string;
  stepKey: string;
  content: ActionStepContent;
  /** YouTube video id from the parent lesson — used to scope the embedded
   *  iframe. Optional: when omitted, only instructions render. */
  videoId?: string;
}

/**
 * Action-in-the-tool step. Embeds the lesson video at the right timestamp,
 * shows instructions, and a single checkbox to confirm the action was done.
 */
export function ActionStep({ lessonSlug, stepKey, content, videoId }: Props) {
  const { isDone, markDone } = useStepDone(lessonSlug, stepKey);

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
          <p className="mt-2.5 text-xs text-text-muted">
            Видео откроется на нужном моменте — посмотри и повтори шаг в инструменте.
          </p>
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
