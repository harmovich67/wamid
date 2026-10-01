"use client";

import { useRef } from "react";
import { Cpu, Keyboard, Monitor } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "./gsap";

function Connector() {
  return (
    <div className="cf-conn relative mx-auto h-12 w-1.5 overflow-hidden rounded-full bg-line md:h-1.5 md:w-full">
      <div className="cf-fill absolute inset-0 origin-top rounded-full bg-gradient-to-b from-primary to-amber md:origin-right md:bg-gradient-to-l" />
    </div>
  );
}

export function ComputerFlow() {
  const root = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const isRow = window.matchMedia("(min-width: 768px)").matches;
        const tl = gsap.timeline({ scrollTrigger: { trigger: ".cf-stage", start: "top 75%", end: "bottom 45%", scrub: 0.6 } });
        tl.from(".cf-node", { y: 40, opacity: 0, scale: 0.9, stagger: 0.5, duration: 0.6, ease: "back.out(1.6)" })
          .from(".cf-key", { y: -16, opacity: 0, stagger: 0.12, duration: 0.3 }, 0.3)
          .fromTo(".cf-conn:nth-child(2) .cf-fill", isRow ? { scaleX: 0 } : { scaleY: 0 }, { scaleX: 1, scaleY: 1, duration: 0.5 }, 0.6)
          .from(".cf-gear", { rotation: -360, duration: 1, ease: "none" }, 0.9)
          .fromTo(".cf-conn:nth-child(4) .cf-fill", isRow ? { scaleX: 0 } : { scaleY: 0 }, { scaleX: 1, scaleY: 1, duration: 0.5 }, 1.3)
          .from(".cf-result", { scale: 0, opacity: 0, duration: 0.5, ease: "back.out(2.5)" }, 1.7);
        gsap.from(".cf-head > *", { y: 24, opacity: 0, stagger: 0.1, scrollTrigger: { trigger: ".cf-head", start: "top 85%" } });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section ref={root} className="relative py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="cf-head mx-auto max-w-3xl text-center">
          <div className="text-sm font-semibold text-sky">كيف يفكّر الحاسوب؟</div>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl lg:text-5xl">مدخلات ← معالجة ← مخرجات</h2>
          <p className="mt-4 text-lg leading-8 text-muted">كل تطبيق تستخدمه — من الألعاب إلى الخرائط — يعمل بهذه الخطوات الثلاث. عندما تفهمها، تبدأ برؤية العالم كمبرمج.</p>
        </div>

        <div className="cf-stage mt-14 grid items-center gap-2 md:grid-cols-[1fr_80px_1fr_80px_1fr] md:gap-4">
          <div className="cf-node rounded-[2rem] border border-line bg-surface p-6 text-center shadow-card">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-soft text-amber"><Keyboard className="size-7" /></div>
            <h3 className="mt-4 text-lg font-bold">المدخلات</h3>
            <p className="mt-1 text-sm text-muted">أنت تكتب سؤالك للحاسوب</p>
            <div className="mt-5 flex justify-center gap-2" dir="ltr">
              {["2", "+", "3"].map((k) => (
                <span key={k} className="cf-key grid size-12 place-items-center rounded-xl border-b-4 border-line bg-surface-2 font-mono text-xl font-bold">{k}</span>
              ))}
            </div>
          </div>
          <Connector />
          <div className="cf-node rounded-[2rem] border border-line bg-surface p-6 text-center shadow-card">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary"><Cpu className="cf-gear size-7" /></div>
            <h3 className="mt-4 text-lg font-bold">المعالجة</h3>
            <p className="mt-1 text-sm text-muted">المعالج يحسب مليارات العمليات في الثانية</p>
            <div className="mt-5 rounded-xl bg-[#0f0d1f] px-3 py-3 font-mono text-sm text-[#b69cff]" dir="ltr">result = 2 + 3</div>
          </div>
          <Connector />
          <div className="cf-node rounded-[2rem] border border-line bg-surface p-6 text-center shadow-card">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-mint-soft text-mint"><Monitor className="size-7" /></div>
            <h3 className="mt-4 text-lg font-bold">المخرجات</h3>
            <p className="mt-1 text-sm text-muted">الشاشة تعرض لك النتيجة</p>
            <div className="cf-result mx-auto mt-5 grid h-12 w-20 place-items-center rounded-xl bg-mint font-mono text-2xl font-bold text-white">5</div>
          </div>
        </div>
      </div>
    </section>
  );
}
