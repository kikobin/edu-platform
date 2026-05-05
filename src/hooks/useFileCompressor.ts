"use client";

import { useCallback, useRef } from "react";
import imageCompression from "browser-image-compression";

const MAX_SIZE_BYTES = 50 * 1024 * 1024;
const TARGET_IMAGE_MB = 1;
const MAX_DIMENSION = 2048;
const JPEG_QUALITY = 0.85;

export interface CompressOptions {
  onProgress?: (percent: number) => void;
}

export interface FileCompressor {
  compress: (file: File, opts?: CompressOptions) => Promise<File>;
}

function isImage(file: File): boolean {
  return file.type.startsWith("image/") && file.type !== "image/svg+xml";
}

function isVideo(file: File): boolean {
  return file.type.startsWith("video/");
}

function isHeic(file: File): boolean {
  const t = file.type.toLowerCase();
  const n = file.name.toLowerCase();
  return (
    t === "image/heic" ||
    t === "image/heif" ||
    n.endsWith(".heic") ||
    n.endsWith(".heif")
  );
}

async function heicToJpeg(file: File): Promise<File> {
  const mod = (await import("heic2any")).default as (opts: {
    blob: Blob;
    toType?: string;
    quality?: number;
  }) => Promise<Blob | Blob[]>;
  const out = await mod({ blob: file, toType: "image/jpeg", quality: JPEG_QUALITY });
  const blob: Blob | undefined = Array.isArray(out) ? out[0] : out;
  if (!blob) throw new Error("Не удалось преобразовать HEIC в JPEG.");
  const newName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
  return new File([blob], newName, { type: "image/jpeg", lastModified: Date.now() });
}

function formatMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1);
}

export function useFileCompressor(): FileCompressor {
  const lastProgressRef = useRef(0);

  const compress = useCallback(
    async (file: File, opts?: CompressOptions): Promise<File> => {
      const onProgress = opts?.onProgress;
      lastProgressRef.current = 0;
      const emit = (p: number) => {
        const next = Math.min(100, Math.max(lastProgressRef.current, Math.round(p)));
        if (next !== lastProgressRef.current) {
          lastProgressRef.current = next;
          onProgress?.(next);
        }
      };

      emit(0);

      let result: File = file;

      if (isImage(file)) {
        let working = file;
        if (isHeic(file)) {
          emit(5);
          working = await heicToJpeg(file);
          emit(35);
        }

        const compressed = await imageCompression(working, {
          maxSizeMB: TARGET_IMAGE_MB,
          maxWidthOrHeight: MAX_DIMENSION,
          useWebWorker: true,
          initialQuality: JPEG_QUALITY,
          fileType: "image/jpeg",
          onProgress: (p: number) => {
            const start = isHeic(file) ? 35 : 5;
            const span = 100 - start - 1;
            emit(start + (p / 100) * span);
          },
        });

        const finalName = compressed.name || working.name;
        result = new File([compressed], finalName, {
          type: compressed.type || "image/jpeg",
          lastModified: Date.now(),
        });
      } else if (isVideo(file)) {
        emit(50);
        result = file;
      } else {
        emit(50);
        result = file;
      }

      emit(100);

      if (result.size > MAX_SIZE_BYTES) {
        throw new Error(
          `Файл слишком большой (${formatMB(result.size)} МБ). Максимум — 50 МБ. Попробуйте уменьшить или обрезать его перед загрузкой.`,
        );
      }

      return result;
    },
    [],
  );

  return { compress };
}
