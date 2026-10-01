"use client";

import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Zap } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/Icon";
import { formatNumber } from "@/lib/utils";
import { useMounted } from "@/components/ui/useMounted";

const COLORS = ["#7C5CFF", "#FFB547", "#22C5A0", "#FF6B81", "#38BDF8"];

// Deterministic pseudo-random so rendering stays pure.
const rand = (i, k) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const SPARKS = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  angle: (i / 28) * Math.PI * 2 + rand(i, 1) * 0.4,
  dist: 140 + rand(i, 2) * 160,
  size: 6 + rand(i, 3) * 10,
  color: COLORS[i % COLORS.length],
  delay: rand(i, 4) * 0.15,
}));

function Sparks() {
  const sparks = SPARKS;
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center">
      {sparks.map((s) => (
        <motion.span
          key={s.id}
          className="absolute rounded-full"
          style={{ width: s.size, height: s.size, background: s.color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
          animate={{ x: Math.cos(s.angle) * s.dist, y: Math.sin(s.angle) * s.dist, opacity: 0, scale: 1 }}
          transition={{ duration: 1.1, delay: s.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

export function Celebration({ open, title, xp, achievements = [], children }) {
  const mounted = useMounted();
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-[#0c0a18]/70 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          dir="rtl"
        >
          <Sparks />
          <motion.div
            initial={{ scale: 0.8, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 16, stiffness: 220 }}
            className="relative w-full max-w-sm rounded-[2rem] border border-line bg-surface p-7 text-center shadow-pop"
          >
            <motion.div
              className="mx-auto w-fit"
              initial={{ rotate: -20, scale: 0.5 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", damping: 10, stiffness: 160, delay: 0.1 }}
            >
              <LogoMark size={84} animated />
            </motion.div>
            <h2 className="mt-5 text-2xl font-bold">{title}</h2>
            {xp > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mx-auto mt-3 flex w-fit items-center gap-1.5 rounded-full bg-primary-soft px-4 py-1.5 text-lg font-bold text-primary"
              >
                <Zap className="size-5 fill-current" /> +{formatNumber(xp)} XP
              </motion.div>
            )}
            {achievements.length > 0 && (
              <div className="mt-5 space-y-2">
                <div className="text-sm text-muted">أوسمة جديدة!</div>
                {achievements.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.45 + i * 0.12 }}
                    className="flex items-center gap-3 rounded-2xl bg-surface-2 p-3 text-start"
                  >
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: a.color }}>
                      <Icon name={a.icon} className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold">{a.title}</div>
                      <div className="truncate text-xs text-muted">{a.description}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            <div className="mt-6 flex flex-col gap-2">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
