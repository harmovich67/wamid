"use client";

import { useRef } from "react";
import { ArrowLeft, Medal, Route, ShieldCheck, Trophy } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { gsap, MOTION_OK, useGSAP } from "./gsap";

const FEATURES = [
  { icon: Route, title: "مسار واضح", text: "تعرف دائمًا أين أنت وما خطوتك التالية." },
  { icon: Trophy, title: "تعلّم كاللعبة", text: "نقاط خبرة ورتب من شرارة إلى مجرّة، وسلاسل يومية." },
  { icon: Medal, title: "مشاريع حقيقية", text: "تحديات ومشاريع يراجعها معلّمك بنفسه." },
  { icon: ShieldCheck, title: "بيئة آمنة", text: "المعلّم يختار المحتوى المناسب لكل طالب." },
];

export function StatsCta({ stats, appHref, loggedIn }) {
  const root = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.utils.toArray(".st-num").forEach((el) => {
          const target = Number(el.dataset.value);
          const obj = { v: 0 };
          gsap.to(obj, {
            v: target,
            duration: 1.6,
            ease: "power2.out",
            snap: { v: 1 },
            onUpdate: () => (el.textContent = obj.v),
            scrollTrigger: { trigger: el, start: "top 90%" },
          });
        });
        gsap.from(".st-feature", { y: 40, opacity: 0, stagger: 0.1, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: ".st-features", start: "top 80%" } });
        gsap.from(".cta-box", { scale: 0.92, opacity: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: ".cta-box", start: "top 85%" } });
        gsap.to(".cta-spark", { y: -12, duration: 2.2, repeat: -1, yoyo: true, ease: "sine.inOut" });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <div ref={root}>
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-[2rem] border border-line bg-surface p-6 text-center shadow-card">
              <div className="font-mono text-4xl font-bold sm:text-5xl" style={{ color: s.color }}>
                <span className="st-num" data-value={s.value}>{s.value}</span>
              </div>
              <div className="mt-2 text-sm text-muted">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="st-features mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="st-feature rounded-[2rem] border border-line bg-surface p-6 shadow-card">
              <div className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                <f.icon className="size-6" />
              </div>
              <h3 className="mt-4 font-bold">{f.title}</h3>
              <p className="mt-1 text-sm leading-7 text-muted">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="cta-box relative overflow-hidden rounded-[2.5rem] bg-[#15102e] px-6 py-16 text-center text-white sm:py-20">
          <div className="bg-grid absolute inset-0 opacity-10" />
          <div className="absolute -top-24 start-10 size-80 rounded-full bg-primary/50 blur-[110px]" />
          <div className="absolute -bottom-24 end-10 size-80 rounded-full bg-amber/30 blur-[110px]" />
          <div className="relative">
            <div className="cta-spark mx-auto w-fit">
              <LogoMark size={72} />
            </div>
            <h2 className="mt-6 text-3xl font-bold sm:text-5xl">جاهز لتشعل شرارتك؟ ✨</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/70">اطلب من معلّمك بيانات الدخول، وابدأ أول درس اليوم. خمس دقائق فقط تكفي للبداية.</p>
            <Button href={appHref} size="lg" variant="amber" className="mt-8">
              {loggedIn ? "إلى لوحتي" : "تسجيل الدخول"} <ArrowLeft className="size-5" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
