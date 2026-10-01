"use client";

import { useRef } from "react";
import { ArrowLeft, ChevronDown, Flame } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { gsap, MOTION_OK, useGSAP } from "./gsap";

const CHIPS = [
  { label: "Python", color: "#7C5CFF", pos: "top-[14%] start-[6%]", depth: 1.4 },
  { label: "JavaScript", color: "#FFB547", pos: "top-[22%] end-[5%]", depth: 1 },
  { label: "HTML", color: "#FF6B81", pos: "bottom-[30%] start-[3%]", depth: 0.8 },
  { label: "React", color: "#38BDF8", pos: "bottom-[18%] end-[8%]", depth: 1.6 },
  { label: "C++", color: "#22C5A0", pos: "top-[48%] start-[14%]", depth: 0.6 },
  { label: "AI ✨", color: "#A78BFA", pos: "top-[56%] end-[16%]", depth: 1.2 },
];

// Headline words are animated as whole words — splitting Arabic by letter would break its joining.
const LINE_1 = ["من", "أول", "سطر", "كود"];
const LINE_2 = ["إلى", "أول", "مشروع", "حقيقي"];

export function Hero({ appHref, loggedIn }) {
  const root = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.from(".hero-logo", { scale: 0.4, rotate: -25, opacity: 0, duration: 1, ease: "back.out(1.7)" })
          .from(".hero-pill", { y: 20, opacity: 0, duration: 0.5 }, "-=0.5")
          .from(".hero-word", { yPercent: 110, opacity: 0, duration: 0.7, stagger: 0.07 }, "-=0.3")
          .from(".hero-sub", { y: 20, opacity: 0, duration: 0.6 }, "-=0.4")
          .from(".hero-cta > *", { y: 16, opacity: 0, duration: 0.5, stagger: 0.1 }, "-=0.35")
          .from(".hero-chip", { scale: 0, opacity: 0, duration: 0.6, stagger: 0.08, ease: "back.out(2)" }, "-=0.6");

        // Gentle idle float for each chip.
        gsap.utils.toArray(".hero-chip").forEach((chip, i) => {
          gsap.to(chip, { y: i % 2 ? 14 : -14, rotate: i % 2 ? 4 : -4, duration: 2.6 + i * 0.3, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 1.2 });
        });

        // Parallax on scroll: chips drift at different depths, the logo shrinks away.
        gsap.utils.toArray(".hero-chip-wrap").forEach((wrap) => {
          gsap.to(wrap, { yPercent: -120 * Number(wrap.dataset.depth), ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true } });
        });
        gsap.to(".hero-content", { y: 120, opacity: 0.2, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true } });
        gsap.to(".hero-glow", { scale: 1.4, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true } });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section ref={root} className="relative flex min-h-[calc(100dvh-4rem)] items-center overflow-hidden">
      <div className="bg-grid absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      <div className="hero-glow absolute start-1/2 top-1/2 size-[560px] -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/25 blur-[130px]" />
      <div className="hero-glow absolute bottom-0 end-10 size-[320px] rounded-full bg-amber/20 blur-[110px]" />

      {CHIPS.map((c) => (
        <div key={c.label} className={`hero-chip-wrap absolute hidden md:block ${c.pos}`} data-depth={c.depth}>
          <div
            className="hero-chip rounded-2xl border border-line bg-surface/80 px-4 py-2 font-mono text-sm font-semibold shadow-card backdrop-blur"
            style={{ color: c.color }}
            dir="ltr"
          >
            {c.label}
          </div>
        </div>
      ))}

      <div className="hero-content relative mx-auto flex max-w-4xl flex-col items-center px-4 py-16 text-center">
        <div className="hero-logo">
          <LogoMark size={104} animated />
        </div>
        <div className="hero-pill mt-8 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-sm text-muted shadow-card">
          <Flame className="size-4 text-amber" /> أكاديمية برمجة للأعمار 10 – 25
        </div>
        <h1 className="mt-6 text-[2.6rem] font-bold leading-[1.3] tracking-tight sm:text-7xl sm:leading-[1.2]">
          <span className="block">
            {LINE_1.map((w, i) => (
              <span key={i} className="inline-block overflow-hidden pb-2 align-bottom">
                <span className="hero-word inline-block">{w}&nbsp;</span>
              </span>
            ))}
          </span>
          <span className="block">
            {LINE_2.map((w, i) => (
              <span key={i} className="inline-block overflow-hidden pb-2 align-bottom">
                <span className="hero-word text-gradient inline-block">{w}&nbsp;</span>
              </span>
            ))}
          </span>
        </h1>
        <p className="hero-sub mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted">
          وَمِيض يعلّمك البرمجة كما تتعلّم لعبة جديدة: خطوة صغيرة، ثم تحدٍّ، ثم مكافأة. بإشراف معلّم حقيقي ومساعد ذكي بجانبك.
        </p>
        <div className="hero-cta mt-9 flex flex-wrap justify-center gap-3">
          <Button href={appHref} size="lg">
            {loggedIn ? "أكمل رحلتك" : "ابدأ رحلتك"} <ArrowLeft className="size-5" />
          </Button>
          <Button href="#story" size="lg" variant="secondary">
            ما هي البرمجة؟
          </Button>
        </div>
      </div>

      <a href="#story" className="absolute bottom-6 start-1/2 grid translate-x-1/2 place-items-center gap-1 text-xs text-muted" aria-label="انزل للأسفل">
        اسحب للأسفل
        <ChevronDown className="size-5 animate-bounce" />
      </a>
    </section>
  );
}
