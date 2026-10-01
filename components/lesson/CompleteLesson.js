"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Celebration } from "./Celebration";
import { api } from "@/lib/client";

export function CompleteLesson({ lessonId, completed, needsQuiz, nextLessonId, courseId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [celebrate, setCelebrate] = useState(null);

  async function complete() {
    setLoading(true);
    try {
      const res = await api(`/api/lessons/${lessonId}/complete`, { method: "POST" });
      setCelebrate(res);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  function go(href) {
    setCelebrate(null);
    router.push(href);
    router.refresh();
  }

  const next = celebrate?.nextLessonId ?? nextLessonId;

  return (
    <>
      <div className="flex flex-col items-stretch justify-between gap-3 rounded-3xl border border-line bg-surface p-5 shadow-card sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          {completed ? <CheckCircle2 className="size-7 text-mint" /> : <PartyPopper className="size-7 text-amber" />}
          <div>
            <div className="font-semibold">{completed ? "أكملت هذا الدرس" : "وصلت لنهاية الدرس!"}</div>
            <div className="text-sm text-muted">
              {completed ? "يمكنك مراجعته في أي وقت." : needsQuiz ? "أجب عن الاختبار أولًا ثم أكمل الدرس." : "أكمل الدرس لتحصل على نقاطك."}
            </div>
          </div>
        </div>
        {completed ? (
          next ? (
            <Button href={`/lessons/${next}`}>
              الدرس التالي <ArrowLeft className="size-4" />
            </Button>
          ) : (
            <Button href={`/courses/${courseId}`} variant="secondary">
              العودة للدورة
            </Button>
          )
        ) : (
          <Button variant="mint" size="lg" onClick={complete} loading={loading} disabled={needsQuiz}>
            <CheckCircle2 className="size-5" /> أكملت الدرس
          </Button>
        )}
      </div>

      <Celebration open={!!celebrate} title="أحسنت! درس جديد في رصيدك" xp={celebrate?.xpEarned ?? 0} achievements={celebrate?.achievements ?? []}>
        {next ? (
          <Button size="lg" onClick={() => go(`/lessons/${next}`)}>
            الدرس التالي <ArrowLeft className="size-4" />
          </Button>
        ) : (
          <Button size="lg" onClick={() => go(`/courses/${courseId}`)}>
            العودة للدورة
          </Button>
        )}
        <Button variant="ghost" onClick={() => go(`/lessons/${lessonId}`)}>
          البقاء هنا
        </Button>
      </Celebration>
    </>
  );
}
