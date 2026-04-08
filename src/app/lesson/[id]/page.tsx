"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProgressStore } from "@/store/progressStore";

interface Props {
  params: { id: string };
}

/**
 * /lesson/[id] — pure redirect.
 * Always sends the user to the video step immediately.
 * The hub UI has been removed — video is the permanent entry point.
 */
export default function LessonPage({ params }: Props) {
  const { id } = params;
  const router = useRouter();
  const isLessonUnlocked = useProgressStore((s) => s.isLessonUnlocked);

  useEffect(() => {
    if (!isLessonUnlocked(id)) {
      router.replace("/dashboard");
    } else {
      router.replace(`/lesson/${id}/video`);
    }
  }, [id, isLessonUnlocked, router]);

  return null;
}
