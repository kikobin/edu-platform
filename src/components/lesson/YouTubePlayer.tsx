"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLElement,
        opts: {
          videoId: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (e: { target: YTPlayer }) => void;
            onStateChange?: (e: { data: number }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: { PLAYING: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
}

interface Props {
  videoId: string;
  /** Called once when the user has watched at least this fraction (default 0.8) */
  onWatchedEnough?: () => void;
  watchThreshold?: number;
}

/**
 * Embeds a YouTube video via the IFrame API.
 * Fires onWatchedEnough when the user has watched ≥ watchThreshold of the video.
 */
export function YouTubePlayer({ videoId, onWatchedEnough, watchThreshold = 0.8 }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const playerRef     = useRef<YTPlayer | null>(null);
  const pollRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const firedRef      = useRef(false);
  const [ready, setReady] = useState(false);

  // Load YouTube IFrame API script once per page
  useEffect(() => {
    if (window.YT?.Player) {
      setReady(true);
      return;
    }
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);

    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      setReady(true);
    };
    return () => {
      // Don't remove the script — it may be shared with other instances
    };
  }, []);

  // Create / destroy player when ready and videoId changes
  useEffect(() => {
    if (!ready || !containerRef.current) return;

    const el = document.createElement("div");
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(el);

    firedRef.current = false;

    playerRef.current = new window.YT.Player(el, {
      videoId,
      playerVars: {
        rel:            0,
        modestbranding: 1,
        enablejsapi:    1,
      },
      events: {
        onReady: () => {
          // Start polling every 2s to track progress
          if (pollRef.current) clearInterval(pollRef.current);
          pollRef.current = setInterval(() => {
            const p = playerRef.current;
            if (!p || firedRef.current) return;
            const dur = p.getDuration();
            const cur = p.getCurrentTime();
            if (dur > 0 && cur / dur >= watchThreshold) {
              firedRef.current = true;
              clearInterval(pollRef.current!);
              pollRef.current = null;
              onWatchedEnough?.();
            }
          }, 2000);
        },
        onStateChange: (e) => {
          // Also fire when video ends (state 0)
          if (e.data === 0 && !firedRef.current) {
            firedRef.current = true;
            if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
            onWatchedEnough?.();
          }
        },
      },
    });

    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [ready, videoId, watchThreshold, onWatchedEnough]);

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-xl">
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="w-8 h-8 rounded-full border-4 border-white/20 border-t-white animate-spin" />
        </div>
      )}
      <div ref={containerRef} className="w-full h-full [&>div]:w-full [&>div]:h-full [&_iframe]:w-full [&_iframe]:h-full" />
    </div>
  );
}
