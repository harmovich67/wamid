"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Keyboard, LoaderCircle, Play, Square, Trash2, TriangleAlert } from "lucide-react";
import { explainError, isRunnable, normalizeLanguage, runCode, TIMEOUT_MS } from "@/lib/runner";
import { cn } from "@/lib/utils";

const NEEDS_INPUT = { python: /\binput\s*\(/, javascript: /\bprompt\s*\(/ };

/** Sandboxed preview for HTML: scripts run, but with an opaque origin (no cookies, no parent access). */
function HtmlPreview({ code, runId }) {
  return (
    <iframe
      key={runId}
      title="معاينة الصفحة"
      sandbox="allow-scripts allow-modals"
      srcDoc={code}
      className="h-80 w-full rounded-b-2xl border-0 bg-white"
    />
  );
}

/**
 * Run button + console for one piece of code. `ref.run()` lets a parent trigger it (Ctrl+Enter).
 * Output is streamed: printed text, echoed input, and a friendly explanation for errors.
 */
export const RunPanel = forwardRef(function RunPanel({ language, code, className, autoFocusInput = false }, ref) {
  const lang = normalizeLanguage(language);
  const [status, setStatus] = useState("idle"); // idle | loading | running | done | error | timeout | stopped
  const [output, setOutput] = useState([]);
  const [error, setError] = useState(null);
  const [stdin, setStdin] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [elapsed, setElapsed] = useState(null);
  const [runId, setRunId] = useState(0);
  const handle = useRef(null);
  const started = useRef(0);
  const screen = useRef(null);
  const needsInput = NEEDS_INPUT[lang]?.test(code) ?? false;
  const inputVisible = showInput || needsInput;
  const busy = status === "loading" || status === "running";

  const run = useCallback(() => {
    if (!isRunnable(lang)) return;
    handle.current?.stop();
    setRunId((n) => n + 1);
    setError(null);
    setElapsed(null);
    if (lang === "html") {
      setStatus("done");
      return;
    }
    setOutput([]);
    setStatus("running");
    handle.current = runCode({
      language: lang,
      code,
      stdin,
      onEvent: (e) => {
        if (e.type === "loading") setStatus("loading");
        else if (e.type === "start") {
          started.current = performance.now();
          setStatus("running");
        } else if (e.type === "out" || e.type === "err" || e.type === "in") {
          setOutput((o) => {
            const last = o.at(-1);
            // Merge consecutive chunks of the same kind so the console stays light.
            if (last && last.type === e.type) return [...o.slice(0, -1), { type: e.type, text: last.text + e.text }];
            return [...o, { type: e.type, text: e.text }];
          });
        } else if (e.type === "error") setError(explainError(e.text, lang));
        else {
          handle.current = null;
          setElapsed(started.current ? (performance.now() - started.current) / 1000 : null);
          setStatus(e.type); // done | timeout | stopped
        }
      },
    });
  }, [lang, code, stdin]);

  useImperativeHandle(ref, () => ({ run }), [run]);
  useEffect(() => () => handle.current?.stop(), []);
  useEffect(() => {
    screen.current?.scrollTo({ top: screen.current.scrollHeight });
  }, [output, error]);

  if (!isRunnable(lang)) return null;
  const hasOutput = output.length > 0 || error || status === "timeout";

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-[#2b2649] bg-[#0b0a17] text-[#e7e5ff]", className)} dir="ltr">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2">
        <button
          type="button"
          onClick={busy ? () => handle.current?.stop() : run}
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition",
            busy ? "bg-coral text-white hover:brightness-110" : "bg-mint text-[#062b22] hover:brightness-110"
          )}
        >
          {busy ? <Square className="size-3.5 fill-current" /> : <Play className="size-3.5 fill-current" />}
          {busy ? "إيقاف" : "تشغيل"}
        </button>
        {lang !== "html" && (
          <button
            type="button"
            onClick={() => setShowInput((v) => !v)}
            className={cn("flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs transition", inputVisible ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white")}
            title="المدخلات التي يقرؤها البرنامج"
          >
            <Keyboard className="size-3.5" /> المدخلات
          </button>
        )}
        <span className="ms-auto text-[11px] text-white/45" dir="rtl">
          {status === "loading" && (
            <span className="flex items-center gap-1.5">
              <LoaderCircle className="size-3.5 animate-spin" /> نجهّز Python لأول مرة… (ثوانٍ قليلة)
            </span>
          )}
          {status === "running" && "يعمل…"}
          {status === "done" && elapsed != null && `انتهى في ${elapsed.toFixed(2)} ث`}
          {status === "stopped" && "أُوقف"}
        </span>
        {hasOutput && !busy && (
          <button type="button" onClick={() => (setOutput([]), setError(null), setStatus("idle"))} className="grid size-8 place-items-center rounded-lg text-white/50 hover:bg-white/5 hover:text-white" aria-label="مسح المخرجات">
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>

      {inputVisible && lang !== "html" && (
        <div className="border-b border-white/10 px-3 py-2">
          <label className="mb-1 block text-[11px] text-white/50" dir="rtl">
            المدخلات: كل قيمة في سطر، تُقرأ بالترتيب عند كل {lang === "python" ? "input()" : "prompt()"}
          </label>
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            rows={2}
            autoFocus={autoFocusInput}
            dir="auto"
            placeholder={"سارة\n12"}
            className="w-full resize-y rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 font-mono text-[13px] text-white outline-none placeholder:text-white/25 focus:border-primary"
          />
        </div>
      )}

      {lang === "html" ? (
        runId > 0 ? <HtmlPreview code={code} runId={runId} /> : <p className="px-4 py-6 text-center text-xs text-white/40" dir="rtl">اضغط «تشغيل» لمعاينة الصفحة هنا.</p>
      ) : (
        <div ref={screen} className="scrollbar-thin max-h-72 min-h-16 overflow-auto px-4 py-3 font-mono text-[13px] leading-6">
          {!hasOutput && !busy && <span className="text-white/30">{"// المخرجات تظهر هنا"}</span>}
          {output.map((o, i) => (
            <span key={i} className={cn("whitespace-pre-wrap break-words", o.type === "err" && "text-coral", o.type === "in" && "text-amber")} dir="auto">
              {o.text}
            </span>
          ))}
          {status === "timeout" && (
            <div className="mt-2 rounded-xl bg-amber/15 px-3 py-2 text-amber" dir="rtl">
              ⏱️ توقف البرنامج لأنه استغرق أكثر من {TIMEOUT_MS / 1000} ثوانٍ. هل هناك حلقة لا تنتهي (while True)؟
            </div>
          )}
          {error && (
            <div className="mt-2 rounded-xl border border-coral/30 bg-coral/10 p-3" dir="rtl">
              <div className="flex items-center gap-2 font-sans text-sm font-semibold text-coral">
                <TriangleAlert className="size-4 shrink-0" />
                {error.type ?? "خطأ"}
                {error.line && <span className="font-normal text-coral/80">· السطر {error.line}</span>}
              </div>
              <div className="mt-1 font-mono text-[12.5px] text-white/80" dir="ltr">
                {error.message}
              </div>
              {error.hint && <p className="mt-2 font-sans text-[13px] leading-6 text-white/75">💡 {error.hint}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
