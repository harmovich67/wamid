"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const POLL_MS = 10000;

/**
 * While a student has this lesson open, silently pulls in teacher edits: polls the lesson's
 * updatedAt and calls router.refresh() when it moves, instead of leaving the page stale.
 */
export function LiveLessonSync({ lessonId, updatedAt }) {
  const router = useRouter();
  const known = useRef(updatedAt);

  useEffect(() => {
    known.current = updatedAt;
  }, [updatedAt]);

  useEffect(() => {
    async function check() {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`/api/lessons/${lessonId}/updated-at`, { cache: "no-store" });
        if (!res.ok) return;
        const { updatedAt: latest } = await res.json();
        if (latest && latest !== known.current) {
          known.current = latest;
          toast.info("المعلّم حدّث هذا الدرس — تم تحديث المحتوى");
          router.refresh();
        }
      } catch {}
    }
    const timer = setInterval(check, POLL_MS);
    window.addEventListener("focus", check);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", check);
    };
  }, [lessonId, router]);

  return null;
}
