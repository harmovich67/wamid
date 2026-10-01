"use client";

import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "./gsap";

// Pre-tokenized so the code can be revealed character by character while keeping its colors.
const TOKENS = [
  ["kw", "for"], ["", " i "], ["kw", "in"], ["", " "], ["fn", "range"], ["", "("], ["num", "1"], ["", ", "], ["num", "6"], ["", "):\n"],
  ["", "    "], ["fn", "print"], ["", "("], ["str", '"⭐"'], ["", " * i)\n"],
  ["", "\n"],
  ["fn", "print"], ["", "("], ["str", '"I am a coder! 🚀"'], ["", ")"],
];
const COLORS = { kw: "#b69cff", fn: "#6cc9ff", num: "#ffc46b", str: "#7ee2c1", "": "#e7e5ff" };
const FULL = TOKENS.map(([, t]) => t).join("");
const OUTPUT = ["⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐", "I am a coder! 🚀"];

// Character counts at which each explanation becomes relevant, and each output line appears.
const EXPLAIN = [
  { at: 0, code: "for", text: "كرّر الأوامر التالية أكثر من مرة" },
  { at: 9, code: "range(1, 6)", text: "الأرقام من 1 إلى 5 — أي 5 مرات" },
  { at: 26, code: 'print("⭐" * i)', text: "اطبع نجمة مكررة i مرة: 1 ثم 2 ثم 3…" },
];

const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function renderUpTo(n) {
  let left = n;
  let html = "";
  for (const [kind, text] of TOKENS) {
    if (left <= 0) break;
    const part = text.slice(0, left);
    left -= part.length;
    html += `<span style="color:${COLORS[kind]}">${escape(part)}</span>`;
  }
  return html;
}

export function CodeTyping() {
  const root = useRef(null);
  const codeEl = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const isLg = window.matchMedia("(min-width: 1024px)").matches;
        const outLines = gsap.utils.toArray(".ct-out");
        const explains = gsap.utils.toArray(".ct-explain");
        const state = { n: 0 };
        const update = () => {
          const n = Math.round(state.n);
          codeEl.current.innerHTML = renderUpTo(n) + '<span class="ct-caret">▍</span>';
          const typedAll = n >= FULL.length;
          outLines.forEach((line, i) => {
            const visible = typedAll && state.n >= FULL.length + i * 4;
            line.style.opacity = visible ? "1" : "0";
            line.style.transform = visible ? "none" : "translateY(8px)";
          });
          explains.forEach((el, i) => {
            const on = n >= EXPLAIN[i].at && (i === EXPLAIN.length - 1 || n < EXPLAIN[i + 1].at || typedAll);
            el.style.opacity = n >= EXPLAIN[i].at ? (on ? "1" : "0.45") : "0.2";
          });
        };
        update();
        gsap.to(state, {
          n: FULL.length + OUTPUT.length * 4 + 2,
          ease: "none",
          onUpdate: update,
          scrollTrigger: isLg
            ? { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 0.5 }
            : { trigger: root.current, start: "top 70%", end: "bottom 60%", scrub: 0.5 },
        });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section ref={root} className="relative lg:h-[260vh]">
      <div className="top-0 flex min-h-dvh items-center py-16 lg:sticky">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <div className="text-sm font-semibold text-mint">أول كود لك</div>
            <h2 className="mt-2 text-3xl font-bold leading-tight sm:text-5xl">3 أسطر فقط… وترسم هرمًا من النجوم</h2>
            <p className="mt-4 text-lg leading-8 text-muted">اسحب للأسفل وشاهد الكود يُكتب أمامك. هذه لغة Python — أول لغة ستتعلّمها في وَمِيض.</p>
            <ul className="mt-8 space-y-3">
              {EXPLAIN.map((e) => (
                <li key={e.code} className="ct-explain flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 shadow-card transition-opacity">
                  <code className="shrink-0 rounded-lg bg-[#0f0d1f] px-2.5 py-1 font-mono text-sm text-[#b69cff]" dir="ltr">{e.code}</code>
                  <span className="text-sm sm:text-base">{e.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4" dir="ltr">
            <div className="overflow-hidden rounded-[2rem] border border-[#2b2649] bg-[#0f0d1f] shadow-pop">
              <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
                <span className="size-2.5 rounded-full bg-coral/80" />
                <span className="size-2.5 rounded-full bg-amber/80" />
                <span className="size-2.5 rounded-full bg-mint/80" />
                <span className="ms-3 font-mono text-xs text-white/50">stars.py</span>
              </div>
              <pre className="min-h-[168px] whitespace-pre-wrap p-5 font-mono text-[15px] leading-8">
                <code ref={codeEl} dangerouslySetInnerHTML={{ __html: renderUpTo(FULL.length) }} />
              </pre>
            </div>
            <div className="overflow-hidden rounded-[2rem] border border-line bg-surface shadow-card">
              <div className="border-b border-line px-5 py-2.5 font-mono text-xs text-muted">▶ output</div>
              <div className="min-h-[220px] space-y-1 p-5 font-mono text-lg">
                {OUTPUT.map((line, i) => (
                  <div key={i} className="ct-out transition-all duration-300">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
