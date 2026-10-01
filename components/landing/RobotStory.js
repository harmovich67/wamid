"use client";

import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "./gsap";

const CELL = 80;
const center = (col, row) => ({ x: col * CELL + CELL / 2, y: row * CELL + CELL / 2 });
const START = center(0, 3);
const ROCKS = [center(1, 1), center(2, 2), center(4, 3), center(0, 0)];
const STAR = center(4, 1);

// Each code line and where the robot is after it runs (rotation: 0 = facing right, -90 = up).
const STEPS = [
  { code: "robot.move(3)", to: center(3, 3), rotate: 0 },
  { code: "robot.turn_left()", to: center(3, 3), rotate: -90 },
  { code: "robot.move(2)", to: center(3, 1), rotate: -90 },
  { code: "robot.turn_right()", to: center(3, 1), rotate: 0 },
  { code: "robot.move(1)", to: center(4, 1), rotate: 0 },
  { code: "robot.collect_star()", to: center(4, 1), rotate: 0 },
];

const CAPTIONS = [
  { title: "الحاسوب مثل هذا الروبوت", text: "قوي وسريع جدًا… لكنه لا يعرف ماذا تريد حتى تخبره بالضبط." },
  { title: "كل سطر = أمر واحد", text: "ينفّذ الأوامر بالترتيب، سطرًا بعد سطر، دون أن يقفز أو يخمّن." },
  { title: "الدقة هي السر", text: "لو كتبت move(2) بدل move(3) لاصطدم بالصخرة! الحاسوب يفعل ما تكتبه حرفيًا." },
  { title: "🎉 وصل للنجمة!", text: "هذه هي البرمجة: أوامر واضحة ومرتّبة تحل مشكلة. وأنت من يكتبها." },
];

const PATH = `M${START.x} ${START.y} L${center(3, 3).x} ${center(3, 3).y} L${center(3, 1).x} ${center(3, 1).y} L${STAR.x} ${STAR.y}`;
const LINE_H = 32;

export function RobotStory() {
  const root = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        // Phones: show one caption at a time (stacked in place) so the pinned scene fits the screen.
        const compact = !window.matchMedia("(min-width: 1024px)").matches;
        const dim = compact ? 0 : 0.3;
        if (compact) {
          const items = gsap.utils.toArray(".rs-caption");
          const h = Math.max(...items.map((el) => el.offsetHeight));
          gsap.set(".rs-captions", { position: "relative", height: h });
          gsap.set(items, { position: "absolute", top: 0, left: 0, right: 0, margin: 0 });
          gsap.set(".rs-dot", { display: "none" });
        }
        gsap.set(".rs-robot", { x: START.x, y: START.y });
        gsap.set(".rs-trail", { drawSVG: "0%" });
        gsap.set(".rs-caption", { opacity: dim });
        gsap.set(".rs-caption:first-child", { opacity: 1 });

        const tl = gsap.timeline({
          defaults: { ease: "power2.inOut", duration: 1 },
          scrollTrigger: { trigger: root.current, start: "top top", end: "+=2600", scrub: 0.8, pin: ".rs-pin" },
        });

        const caption = (i) => {
          tl.to(".rs-caption", { opacity: dim, duration: 0.3 }, "<").to(`.rs-caption:nth-child(${i + 1})`, { opacity: 1, duration: 0.3 }, "<");
          tl.to(".rs-dot", { scale: 0.6, backgroundColor: "var(--line)", duration: 0.3 }, "<").to(`.rs-caption:nth-child(${i + 1}) .rs-dot`, { scale: 1, backgroundColor: "var(--primary)", duration: 0.3 }, "<");
        };

        tl.to(".rs-highlight", { opacity: 1, duration: 0.3 });
        caption(1);
        let trail = 0;
        STEPS.forEach((step, i) => {
          tl.to(".rs-highlight", { y: i * LINE_H, duration: 0.35 });
          tl.to(`.rs-line-${i}`, { color: "#ffffff", duration: 0.2 }, "<");
          if (i > 0) tl.to(`.rs-line-${i - 1}`, { color: "#8f8ab3", duration: 0.2 }, "<");
          if (i === 2) caption(2);
          if (step.code.startsWith("robot.move")) {
            trail += step.code.includes("(3)") ? 50 : step.code.includes("(2)") ? 33.3 : 16.7;
            tl.to(".rs-robot", { x: step.to.x, y: step.to.y, duration: 1 });
            tl.to(".rs-trail", { drawSVG: `${Math.min(trail, 100)}%`, duration: 1 }, "<");
          } else if (step.code.includes("turn")) {
            tl.to(".rs-robot-body", { rotation: step.rotate, svgOrigin: "0 0", duration: 0.6, ease: "back.out(2)" });
          } else {
            tl.to(".rs-star", { scale: 1.6, rotation: 180, svgOrigin: `${STAR.x} ${STAR.y}`, duration: 0.5 })
              .to(".rs-star", { scale: 0, opacity: 0, svgOrigin: `${STAR.x} ${STAR.y}`, duration: 0.4 })
              .fromTo(".rs-burst", { scale: 0, opacity: 1 }, { scale: 1.8, opacity: 0, svgOrigin: `${STAR.x} ${STAR.y}`, duration: 0.8 }, "<")
              .fromTo(".rs-success", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 }, "<");
            caption(3);
          }
        });
        tl.to({}, { duration: 0.6 });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section id="story" ref={root} className="relative scroll-mt-16">
      <div className="rs-pin flex min-h-dvh items-center py-6 sm:py-10">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.4fr] lg:gap-12">
          <div>
            <div className="text-sm font-semibold text-primary">الدرس الأول في 30 ثانية</div>
            <h2 className="mt-1 text-3xl font-bold leading-tight sm:mt-2 sm:text-5xl">ما هي البرمجة؟</h2>
            <ol className="rs-captions mt-4 space-y-4 sm:mt-8">
              {CAPTIONS.map((c, i) => (
                <li key={i} className="rs-caption flex gap-3">
                  <span className="rs-dot mt-2 size-3 shrink-0 rounded-full bg-primary" />
                  <div>
                    <div className="font-bold sm:text-lg">{c.title}</div>
                    <p className="text-sm leading-7 text-muted sm:text-base">{c.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_1fr] sm:gap-4 lg:grid-cols-1 xl:grid-cols-[1.15fr_1fr]">
            <div className="relative mx-auto w-full max-w-[330px] overflow-hidden rounded-[2rem] border border-line bg-surface p-3 shadow-pop sm:max-w-none">
              <svg viewBox="0 0 400 320" className="w-full" role="img" aria-label="روبوت يتحرك على شبكة نحو نجمة">
                {Array.from({ length: 20 }, (_, i) => (
                  <rect key={i} x={(i % 5) * CELL + 3} y={Math.floor(i / 5) * CELL + 3} width={CELL - 6} height={CELL - 6} rx="14" fill="var(--surface-2)" />
                ))}
                {ROCKS.map((r, i) => (
                  <g key={i} transform={`translate(${r.x} ${r.y})`}>
                    <path d="M-22 14 L-14 -10 L2 -18 L18 -8 L22 14 Z" fill="var(--line)" />
                    <path d="M-14 -10 L2 -18 L4 -4 Z" fill="var(--muted)" opacity=".25" />
                  </g>
                ))}
                <path className="rs-trail" d={PATH} fill="none" stroke="var(--primary)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity=".45" />
                <circle className="rs-burst" cx={STAR.x} cy={STAR.y} r="30" fill="none" stroke="#FFB547" strokeWidth="4" opacity="0" />
                <path
                  className="rs-star"
                  d={`M${STAR.x} ${STAR.y - 24} L${STAR.x + 7} ${STAR.y - 7} L${STAR.x + 24} ${STAR.y} L${STAR.x + 7} ${STAR.y + 7} L${STAR.x} ${STAR.y + 24} L${STAR.x - 7} ${STAR.y + 7} L${STAR.x - 24} ${STAR.y} L${STAR.x - 7} ${STAR.y - 7} Z`}
                  fill="#FFB547"
                />
                <g className="rs-robot" transform={`translate(${START.x} ${START.y})`}>
                  <g className="rs-robot-body">
                    <rect x="-24" y="-24" width="48" height="48" rx="14" fill="#7C5CFF" />
                    <rect x="-16" y="-14" width="32" height="20" rx="7" fill="#1b1540" />
                    <circle cx="-6" cy="-4" r="4" fill="#7ee2c1" />
                    <circle cx="6" cy="-4" r="4" fill="#7ee2c1" />
                    <path d="M24 -6 L34 0 L24 6 Z" fill="#FFB547" />
                    <line x1="0" y1="-24" x2="0" y2="-32" stroke="#7C5CFF" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="0" cy="-34" r="4" fill="#FFB547" />
                  </g>
                </g>
              </svg>
              <div className="rs-success pointer-events-none absolute inset-x-0 bottom-4 mx-auto w-fit rounded-full bg-mint px-4 py-1.5 text-sm font-bold text-white opacity-0 shadow-card">
                ✓ نجح البرنامج!
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-[#2b2649] bg-[#0f0d1f] shadow-pop" dir="ltr">
              <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
                <span className="size-2.5 rounded-full bg-coral/80" />
                <span className="size-2.5 rounded-full bg-amber/80" />
                <span className="size-2.5 rounded-full bg-mint/80" />
                <span className="ms-3 font-mono text-xs text-white/50">robot.py</span>
              </div>
              <div className="relative p-3 font-mono text-[13px] sm:p-4 sm:text-sm">
                <div className="rs-highlight absolute inset-x-2 top-3 rounded-lg sm:top-4 bg-primary/25 opacity-0" style={{ height: LINE_H }} />
                {STEPS.map((s, i) => (
                  <div key={i} className={`rs-line-${i} relative flex items-center gap-4 text-[#8f8ab3]`} style={{ height: LINE_H }}>
                    <span className="w-4 text-end text-white/25">{i + 1}</span>
                    <span>
                      <span className="text-[#6cc9ff]">robot</span>.{s.code.replace("robot.", "")}
                    </span>
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
