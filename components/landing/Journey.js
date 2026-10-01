"use client";

import { useRef } from "react";
import { Icon } from "@/components/ui/Icon";
import { gsap, MOTION_OK, useGSAP } from "./gsap";

const AGES = ["من عمر 10 سنوات", "خطوة بخطوة", "واجهات وخوادم", "جاهز لسوق العمل"];

export function Journey({ levels }) {
  const root = useRef(null);
  const track = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      // Desktop: pin the section and scroll the level cards sideways (RTL → content moves right).
      mm.add(`${MOTION_OK} and (min-width: 1024px)`, () => {
        const distance = () => Math.max(0, track.current.scrollWidth - window.innerWidth + 96);
        gsap.to(track.current, {
          x: () => distance(),
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: () => `+=${distance()}`, scrub: 0.6, pin: true, invalidateOnRefresh: true },
        });
        gsap.fromTo(".jr-progress", { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: () => `+=${distance()}`, scrub: true } });
        gsap.from(".jr-course", { y: 16, opacity: 0, stagger: 0.03, duration: 0.5, scrollTrigger: { trigger: root.current, start: "top 60%" } });
      });
      // Mobile: simple reveal as cards enter.
      mm.add(`${MOTION_OK} and (max-width: 1023px)`, () => {
        gsap.utils.toArray(".jr-card").forEach((card) => {
          gsap.from(card, { y: 50, opacity: 0, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: card, start: "top 85%" } });
        });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section id="journey" ref={root} className="relative overflow-hidden py-20 lg:flex lg:min-h-dvh lg:flex-col lg:justify-center">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="text-sm font-semibold text-amber">خريطة الرحلة</div>
        <h2 className="mt-2 text-3xl font-bold sm:text-5xl">أربع محطات… ومبرمج جديد</h2>
        <div className="mt-6 hidden h-1.5 overflow-hidden rounded-full bg-line lg:block">
          <div className="jr-progress h-full origin-right rounded-full bg-gradient-to-l from-amber via-primary to-mint" />
        </div>
      </div>

      <div ref={track} className="mt-10 flex flex-col gap-5 px-4 sm:px-6 lg:w-max lg:flex-row lg:items-stretch lg:gap-6 lg:ps-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]">
        {levels.map((level, i) => (
          <article
            key={level.id}
            className="jr-card relative flex flex-col overflow-hidden rounded-[2rem] border border-line bg-surface p-6 shadow-card sm:p-8 lg:w-[420px]"
          >
            <div className="absolute -end-10 -top-10 size-48 rounded-full opacity-15 blur-2xl" style={{ background: level.color }} />
            <div className="absolute end-6 top-4 font-mono text-8xl font-bold opacity-10" style={{ color: level.color }}>
              {i + 1}
            </div>
            <div className="relative grid size-16 place-items-center rounded-2xl text-white shadow-pop" style={{ background: level.color }}>
              <Icon name={level.icon} className="size-8" />
            </div>
            <div className="relative mt-6 text-sm font-semibold" style={{ color: level.color }}>
              المحطة {i + 1} · {AGES[i] ?? ""}
            </div>
            <h3 className="relative mt-1 text-2xl font-bold">{level.title}</h3>
            {level.subtitle && <p className="relative mt-2 leading-7 text-muted">{level.subtitle}</p>}
            <div className="relative mt-6 border-t border-line pt-5 text-xs font-semibold text-muted">الدورات</div>
            <div className="relative mt-3 flex flex-wrap gap-2">
              {level.courses.map((c) => (
                <span key={c} className="jr-course rounded-xl border border-line bg-surface-2 px-3 py-1.5 text-sm">
                  {c}
                </span>
              ))}
            </div>
          </article>
        ))}
        <article className="jr-card flex flex-col items-center justify-center rounded-[2rem] bg-gradient-to-br from-primary to-[#4F32E6] p-8 text-center text-white lg:w-[340px]">
          <div className="text-6xl">🚀</div>
          <h3 className="mt-4 text-2xl font-bold">وأنت الآن مطوّر!</h3>
          <p className="mt-2 text-white/75">مشاريع حقيقية في معرض أعمالك، وخبرة العمل ضمن فريق.</p>
        </article>
      </div>
    </section>
  );
}
