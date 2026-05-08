"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Kind = "image" | "video" | "pdf" | "r2-other" | "url" | "text";

const IMAGE_RE = /\.(jpe?g|png|webp|heic|heif)(\?.*)?$/i;
const VIDEO_RE = /\.(mp4|mov|webm)(\?.*)?$/i;
const PDF_RE = /\.pdf(\?.*)?$/i;
const R2_RE = /^https:\/\/pub-[^/]+\.r2\.dev\//i;
const URL_RE = /^https?:\/\//i;

function detectKind(content: string): { kind: Kind; url?: string } {
  const trimmed = content.trim();
  if (R2_RE.test(trimmed)) {
    if (IMAGE_RE.test(trimmed)) return { kind: "image", url: trimmed };
    if (VIDEO_RE.test(trimmed)) return { kind: "video", url: trimmed };
    if (PDF_RE.test(trimmed)) return { kind: "pdf", url: trimmed };
    return { kind: "r2-other", url: trimmed };
  }
  if (URL_RE.test(trimmed)) return { kind: "url", url: trimmed };
  return { kind: "text" };
}

function fileNameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop();
    return last ? decodeURIComponent(last) : url;
  } catch {
    return url;
  }
}

function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Закрыть"
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-xl flex items-center justify-center transition-colors"
      >
        ✕
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
      />
    </div>
  );
}

function DownloadButton({ url }: { url: string }) {
  return (
    <a
      href={url}
      download
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-purple-50 text-purple-700 border border-purple-100 hover:bg-purple-100 transition-colors"
    >
      <span aria-hidden>⬇</span> Скачать
    </a>
  );
}

function ImageBlock({ url }: { url: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-full max-w-md">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full rounded-2xl border border-purple-100 bg-white shadow-sm hover:shadow-md overflow-hidden transition-all"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt="Работа ученика"
          loading="lazy"
          className="w-full h-auto max-h-80 object-cover"
        />
      </button>
      <div className="mt-2 flex justify-end">
        <DownloadButton url={url} />
      </div>
      {open && <Lightbox src={url} onClose={() => setOpen(false)} />}
    </div>
  );
}

function VideoBlock({ url }: { url: string }) {
  return (
    <div className="w-full max-w-md">
      <video
        controls
        preload="metadata"
        className="block w-full rounded-2xl border border-purple-100 bg-black shadow-sm"
      >
        <source src={url} />
      </video>
      <div className="mt-2 flex justify-end">
        <DownloadButton url={url} />
      </div>
    </div>
  );
}

function PdfBlock({ url }: { url: string }) {
  const name = fileNameFromUrl(url);
  return (
    <div className="w-full max-w-md rounded-2xl border border-purple-100 bg-white shadow-sm overflow-hidden">
      <iframe
        src={url}
        title={name}
        className="w-full h-72 sm:h-96 bg-gray-50"
      />
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-purple-100">
        <span className="text-xs text-gray-500 truncate">{name}</span>
        <a
          href={url}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-purple-50 text-purple-700 border border-purple-100 hover:bg-purple-100 transition-colors"
        >
          <span aria-hidden>⬇</span> Скачать
        </a>
      </div>
    </div>
  );
}

function FileLink({ url }: { url: string }) {
  const name = fileNameFromUrl(url);
  return (
    <a
      href={url}
      download
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 max-w-full px-4 py-2.5 rounded-2xl border border-purple-100 bg-white shadow-sm hover:shadow-md hover:border-purple-200 transition-all"
    >
      <span
        aria-hidden
        className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm shrink-0"
      >
        ⬇
      </span>
      <span className="text-sm text-gray-700 truncate">{name}</span>
    </a>
  );
}

function UrlCard({ url }: { url: string }) {
  const host = hostFromUrl(url);
  const favicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-3 max-w-full px-4 py-2.5 rounded-2xl border border-purple-100 bg-white shadow-sm hover:shadow-md hover:border-purple-200 transition-all"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={favicon}
        alt=""
        width={20}
        height={20}
        className="w-5 h-5 rounded shrink-0"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
        }}
      />
      <span className="flex flex-col min-w-0">
        <span className="text-sm font-semibold text-gray-900 truncate">{host}</span>
        <span className="text-xs text-gray-500 truncate">{url}</span>
      </span>
    </a>
  );
}

function TextBlock({ text }: { text: string }) {
  return (
    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{text}</p>
  );
}

export function SubmissionContent({
  content,
  fileUrl,
  fileMime,
  className,
}: {
  content: string;
  fileUrl?: string;
  fileMime?: string;
  className?: string;
}) {
  // If we have an explicit fileUrl (uploaded to R2), use it directly
  if (fileUrl) {
    const mime = fileMime ?? "";
    const isImage = mime.startsWith("image/");
    const isVideo = mime.startsWith("video/");
    const isPdf   = mime === "application/pdf";
    return (
      <div className={cn("max-w-full", className)}>
        {isImage && <ImageBlock url={fileUrl} />}
        {isVideo && <VideoBlock url={fileUrl} />}
        {isPdf   && <PdfBlock   url={fileUrl} />}
        {!isImage && !isVideo && !isPdf && <FileLink url={fileUrl} />}
        {/* Show content text (e.g. selected level) below the file */}
        {content && <TextBlock text={content} />}
      </div>
    );
  }

  if (!content) return null;
  const { kind, url } = detectKind(content);

  return (
    <div className={cn("max-w-full", className)}>
      {kind === "image" && url && <ImageBlock url={url} />}
      {kind === "video" && url && <VideoBlock url={url} />}
      {kind === "pdf" && url && <PdfBlock url={url} />}
      {kind === "r2-other" && url && <FileLink url={url} />}
      {kind === "url" && url && <UrlCard url={url} />}
      {kind === "text" && <TextBlock text={content} />}
    </div>
  );
}

export default SubmissionContent;
