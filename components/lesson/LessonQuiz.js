"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Check, CircleHelp, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/client";
import { cn, formatNumber } from "@/lib/utils";

const OPTION_LETTERS = ["أ", "ب", "ج", "د", "هـ", "و"];

export function LessonQuiz({ lessonId, questions, previous }) {
  const router = useRouter();
  const [answers, setAnswers] = useState(() => questions.map(() => null));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const allAnswered = answers.every((a) => a !== null);

  async function submit() {
    setLoading(true);
    try {
      const res = await api(`/api/lessons/${lessonId}/quiz`, { method: "POST", body: { answers } });
      setResult(res);
      if (res.score === res.total) toast.success("علامة كاملة! 🌟");
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  function retry() {
    setAnswers(questions.map(() => null));
    setResult(null);
  }

  return (
    <section className="rounded-3xl border border-line bg-surface p-5 shadow-card sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-sky-soft text-sky">
            <CircleHelp className="size-6" />
          </div>
          <div>
            <h2 className="font-semibold">اختبر فهمك</h2>
            <p className="text-sm text-muted">
              {formatNumber(questions.length)} أسئلة
              {previous?.quizTotal ? ` · آخر نتيجة: ${formatNumber(previous.quizScore)}/${formatNumber(previous.quizTotal)}` : ""}
            </p>
          </div>
        </div>
        {result && (
          <div className={cn("rounded-2xl px-4 py-2 text-lg font-bold", result.score === result.total ? "bg-mint-soft text-mint" : "bg-amber-soft text-amber")}>
            {formatNumber(result.score)}/{formatNumber(result.total)}
          </div>
        )}
      </div>

      <div className="space-y-6">
        {questions.map((q, qi) => {
          const r = result?.results?.[qi];
          return (
            <div key={q.id}>
              <div className="mb-3 font-medium">
                <span className="text-primary">{formatNumber(qi + 1)}. </span>
                {q.question}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {q.options.map((opt, oi) => {
                  const selected = answers[qi] === oi;
                  const isCorrect = r && r.correctIndex === oi;
                  const isWrong = r && selected && !r.correct;
                  return (
                    <motion.button
                      key={oi}
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      disabled={!!result}
                      onClick={() => setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-start text-sm transition-colors",
                        !result && (selected ? "border-primary bg-primary-soft" : "border-line hover:border-primary/40 hover:bg-surface-2"),
                        isCorrect && "border-mint bg-mint-soft",
                        isWrong && "border-coral bg-coral-soft",
                        result && !isCorrect && !isWrong && "border-line opacity-60"
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-7 shrink-0 place-items-center rounded-lg border-2 text-xs font-bold",
                          selected && !result ? "border-primary bg-primary text-white" : "border-line",
                          isCorrect && "border-mint bg-mint text-white",
                          isWrong && "border-coral bg-coral text-white"
                        )}
                      >
                        {isCorrect ? <Check className="size-4" /> : isWrong ? <X className="size-4" /> : OPTION_LETTERS[oi]}
                      </span>
                      <span className="flex-1">{opt}</span>
                    </motion.button>
                  );
                })}
              </div>
              <AnimatePresence>
                {r?.explanation && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-2 rounded-xl bg-surface-2 px-3.5 py-2.5 text-sm text-muted"
                  >
                    💡 {r.explanation}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        {result ? (
          <Button variant="secondary" onClick={retry}>
            <RotateCcw className="size-4" /> إعادة المحاولة
          </Button>
        ) : (
          <Button onClick={submit} disabled={!allAnswered} loading={loading}>
            تحقّق من إجاباتي
          </Button>
        )}
      </div>
    </section>
  );
}
