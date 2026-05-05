"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useFileCompressor } from "@/hooks/useFileCompressor";

export interface FileDropzoneProps {
  onFileReady: (file: File) => void;
  maxSizeMB?: number;
  accept?: string;
  className?: string;
  label?: string;
}

interface PreviewState {
  file: File;
  url: string | null;
  kind: "image" | "video" | "pdf" | "other";
}

function detectKind(file: File): PreviewState["kind"] {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type === "application/pdf") return "pdf";
  return "other";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function matchesAccept(file: File, accept: string): boolean {
  if (!accept) return true;
  const patterns = accept.split(",").map((s) => s.trim()).filter(Boolean);
  return patterns.some((p) => {
    if (p.endsWith("/*")) {
      const prefix = p.slice(0, -1);
      return file.type.startsWith(prefix);
    }
    if (p.startsWith(".")) {
      return file.name.toLowerCase().endsWith(p.toLowerCase());
    }
    return file.type === p;
  });
}

export function FileDropzone({
  onFileReady,
  maxSizeMB = 50,
  accept = "image/*,video/mp4,application/pdf",
  className,
  label = "Перетащите файл сюда или нажмите для выбора",
}: FileDropzoneProps) {
  const { compress } = useFileCompressor();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);

  useEffect(() => {
    return () => {
      if (preview?.url) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  const reset = useCallback(() => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
    setProgress(0);
    setError(null);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }, [preview]);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      if (!matchesAccept(file, accept)) {
        setError("Этот тип файла не поддерживается.");
        return;
      }

      const rawLimit = maxSizeMB * 1024 * 1024;
      if (file.type.startsWith("video/") && file.size > rawLimit) {
        setError(
          `Видео слишком большое (${formatSize(file.size)}). Максимум — ${maxSizeMB} МБ.`,
        );
        return;
      }

      setBusy(true);
      setProgress(0);

      try {
        const out = await compress(file, { onProgress: setProgress });

        if (out.size > maxSizeMB * 1024 * 1024) {
          setError(
            `Файл всё ещё больше ${maxSizeMB} МБ после сжатия. Попробуйте другой.`,
          );
          setBusy(false);
          return;
        }

        const kind = detectKind(out);
        const url = kind === "image" || kind === "video" ? URL.createObjectURL(out) : null;
        setPreview({ file: out, url, kind });
        setBusy(false);
        onFileReady(out);
      } catch (e) {
        setBusy(false);
        setProgress(0);
        setError(e instanceof Error ? e.message : "Не удалось обработать файл.");
      }
    },
    [accept, compress, maxSizeMB, onFileReady],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f) void handleFile(f);
    },
    [handleFile],
  );

  const onPick = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) void handleFile(f);
    },
    [handleFile],
  );

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputRef.current?.click();
    }
  }, []);

  if (preview) {
    return (
      <div
        className={cn(
          "relative rounded-2xl border border-border bg-bg-card p-4 shadow-card",
          className,
        )}
      >
        <div className="flex items-start gap-4">
          <div className="shrink-0">
            {preview.kind === "image" && preview.url && (
              // next/image rejects blob: URLs from createObjectURL — keep <img>.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview.url}
                alt={preview.file.name}
                className="h-24 w-24 rounded-lg object-cover ring-1 ring-border"
              />
            )}
            {preview.kind === "video" && preview.url && (
              <video
                src={preview.url}
                className="h-24 w-24 rounded-lg object-cover ring-1 ring-border bg-dark"
                muted
                playsInline
              />
            )}
            {preview.kind === "pdf" && (
              <div className="h-24 w-24 rounded-lg bg-primary-light text-primary flex items-center justify-center font-bold text-sm">
                PDF
              </div>
            )}
            {preview.kind === "other" && (
              <div className="h-24 w-24 rounded-lg bg-primary-light text-primary flex items-center justify-center font-bold text-xs">
                FILE
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-text" title={preview.file.name}>
              {preview.file.name}
            </p>
            <p className="mt-1 text-xs text-text-muted">{formatSize(preview.file.size)}</p>
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-accent/15 px-2 py-0.5 text-2xs font-semibold text-dark">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Готов к загрузке
            </p>
          </div>

          <button
            type="button"
            onClick={reset}
            className="shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold text-error hover:bg-error-light transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-error"
          >
            Удалить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        role="button"
        tabIndex={0}
        aria-busy={busy}
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={onKeyDown}
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-all",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          dragOver
            ? "border-primary bg-primary-light"
            : "border-border bg-bg-card hover:border-primary hover:bg-primary-light/40",
          busy && "pointer-events-none opacity-90",
        )}
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light text-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        <p className="text-sm font-semibold text-text">{label}</p>
        <p className="mt-1 text-xs text-text-muted">
          До {maxSizeMB} МБ · изображения, видео или PDF
        </p>

        {busy && (
          <div className="mt-5 w-full max-w-xs">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary-light">
              <div
                className="h-full rounded-full bg-accent transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-2xs font-semibold text-primary">
              Обработка… {progress}%
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={onPick}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-md bg-error-light px-3 py-2 text-xs font-medium text-error"
        >
          {error}
        </p>
      )}
    </div>
  );
}
