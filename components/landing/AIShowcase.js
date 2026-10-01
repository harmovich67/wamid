"use client";

import { useRef } from "react";
import { Bug, Lightbulb, ScanSearch } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { gsap, MOTION_OK, useGSAP } from "./gsap";

const MODES = [
  { icon: Lightbulb, title: "يشرح لك", text: "أي مفهوم بتشبيه من حياتك ومثال صغير." },
  { icon: ScanSearch, title: "يراجع كودك", text: "يخبرك بما أحسنت فيه وكيف تحسّن الباقي." },
  { icon: Bug, title: "يساعدك في الأخطاء", text: "يفسّر رسالة الخطأ ويعلّمك كيف تكتشفه." },
];

export function AIShowcase() {
  const root = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: ".ai-chat", start: "top 70%" } });
        tl.from(".ai-chat", { y: 40, opacity: 0, duration: 0.6, ease: "power3.out" })
          .from(".ai-msg-1", { x: -30, opacity: 0, duration: 0.4 })
          .from(".ai-typing", { opacity: 0, duration: 0.2 })
          .to(".ai-typing", { opacity: 0, duration: 0.2, delay: 0.9 })
          .from(".ai-msg-2", { x: 30, opacity: 0, duration: 0.5 })
          .from(".ai-msg-2 .ai-line", { opacity: 0, y: 6, stagger: 0.25, duration: 0.3 });
        gsap.from(".ai-mode", { y: 30, opacity: 0, stagger: 0.12, duration: 0.6, ease: "power3.out", scrollTrigger: { trigger: ".ai-modes", start: "top 80%" } });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section ref={root} className="relative py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <div className="text-sm font-semibold text-primary">ومضة AI</div>
          <h2 className="mt-2 text-3xl font-bold leading-tight sm:text-5xl">معلّم خصوصي ذكي… لا يحل عنك</h2>
          <p className="mt-4 text-lg leading-8 text-muted">
            مساعد مبني على Gemini، مضبوط ليقودك للحل بأسئلة وتلميحات بدل أن يعطيك الإجابة جاهزة. والمعلّم يتحكم في من يستخدمه ومتى.
          </p>
          <div className="ai-modes mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {MODES.map((m) => (
              <div key={m.title} className="ai-mode rounded-2xl border border-line bg-surface p-4 shadow-card">
                <m.icon className="size-6 text-primary" />
                <div className="mt-3 font-bold">{m.title}</div>
                <p className="mt-1 text-sm text-muted">{m.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="ai-chat relative rounded-[2rem] border border-line bg-surface p-5 shadow-pop sm:p-6">
          <div className="flex items-center gap-3 border-b border-line pb-4">
            <LogoMark size={40} animated />
            <div>
              <div className="font-bold">ومضة AI</div>
              <div className="text-xs text-mint">● متصل</div>
            </div>
          </div>
          <div className="space-y-4 pt-5">
            <div className="ai-msg-1 ms-auto w-fit max-w-[85%] rounded-3xl rounded-se-md bg-primary px-4 py-3 text-white">
              الكود لا يعمل 😩 يقول لي <span className="font-mono text-sm" dir="ltr">IndentationError</span>
            </div>
            <div className="ai-typing flex w-fit gap-1 rounded-3xl bg-surface-2 px-4 py-3">
              <span className="size-2 animate-pulse rounded-full bg-primary" />
              <span className="size-2 animate-pulse rounded-full bg-primary [animation-delay:150ms]" />
              <span className="size-2 animate-pulse rounded-full bg-primary [animation-delay:300ms]" />
            </div>
            <div className="ai-msg-2 w-fit max-w-[90%] space-y-2 rounded-3xl rounded-ss-md bg-surface-2 px-4 py-3 leading-7">
              <p className="ai-line">لا تقلق، هذا خطأ شائع جدًا! 💪</p>
              <p className="ai-line">
                بايثون تعتمد على <b>المسافات في بداية السطر</b> لتعرف أي أوامر داخل الحلقة.
              </p>
              <p className="ai-line">
                🔍 تلميح: انظر للسطر بعد <code className="rounded bg-surface px-1.5 font-mono text-sm" dir="ltr">for</code> — هل يبدأ بـ 4 مسافات؟
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
