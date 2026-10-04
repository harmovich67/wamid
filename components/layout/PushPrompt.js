"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { BellRing, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { enablePush, permission, serverPushActive } from "@/lib/push-client";
import { publishPushState } from "./NotificationBell";

const SNOOZE_KEY = "wameed-push-prompt";
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000;

function snoozed() {
  try {
    return Number(localStorage.getItem(SNOOZE_KEY) || 0) > Date.now();
  } catch {
    return false;
  }
}

/**
 * Friendly card that asks once (then every few days if dismissed) to turn on browser notifications.
 * The real browser prompt only appears after the user taps "تفعيل" — browsers block unprompted requests.
 */
export function PushPrompt({ audience = "student" }) {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (permission() !== "default" || snoozed()) return;
    const timer = setTimeout(() => setShow(true), 2500);
    const onChange = () => setShow(false);
    window.addEventListener("wameed:push-permission", onChange);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("wameed:push-permission", onChange);
    };
  }, []);

  function later() {
    try {
      localStorage.setItem(SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
    } catch {}
    setShow(false);
  }

  async function enable() {
    setBusy(true);
    const result = await enablePush().catch(() => "default");
    setBusy(false);
    setShow(false);
    publishPushState(result === "granted" && serverPushActive() ? "on" : result);
    if (result === "granted") toast.success("تم تفعيل إشعارات المتصفح ✅");
    else if (result === "denied") toast.error("تم رفض الإشعارات. يمكنك السماح بها لاحقًا من إعدادات الموقع.");
    else later();
  }

  const copy =
    audience === "admin"
      ? "تنبيه فوري عند وصول رسالة من طالب أو تسليم مهمة جديدة — حتى لو كانت الصفحة مغلقة."
      : "ليصلك تنبيه فوري برسائل المعلّم والدروس والمهام الجديدة — حتى لو كانت الصفحة مغلقة.";

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="dialog"
          aria-label="تفعيل إشعارات المتصفح"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={{ type: "spring", damping: 26, stiffness: 300 }}
          className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-md rounded-3xl border border-line bg-surface p-4 shadow-pop sm:inset-x-auto sm:end-6 sm:bottom-6 lg:bottom-6"
        >
          <button onClick={later} className="absolute end-3 top-3 grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg" aria-label="إغلاق">
            <X className="size-4" />
          </button>
          <div className="flex items-start gap-3 pe-8">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
              <BellRing className="size-5 animate-[float_3s_ease-in-out_infinite]" />
            </span>
            <div className="min-w-0">
              <div className="font-semibold">فعّل إشعارات المتصفح</div>
              <p className="mt-0.5 text-sm leading-6 text-muted">{copy}</p>
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={later}>
              لاحقًا
            </Button>
            <Button size="sm" loading={busy} onClick={enable}>
              {!busy && <BellRing className="size-4" />} تفعيل
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
