"use client";

import { useEffect, useState } from "react";
import { LogoMark } from "@/components/brand/Logo";

const SPLASH_KEY = "wm-splash";
// Matches the CSS timeline in globals.css (.wm-splash): last animation ends at ~4.9s.
const DURATION_MS = 4900;

/**
 * Mobile-first intro shown once per browser session: the teacher's greeting, then the platform name lighting up like neon.
 * Pure-CSS timeline (it fades itself out even if JS is slow); JS only unmounts it and remembers it was seen. Tap to skip.
 */
export function Splash() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = Boolean(sessionStorage.getItem(SPLASH_KEY));
      sessionStorage.setItem(SPLASH_KEY, "1");
    } catch {}
    // Already seen: the head script hid it with CSS, just unmount it.
    const t = setTimeout(() => setDone(true), seen ? 0 : DURATION_MS);
    return () => clearTimeout(t);
  }, []);

  if (done) return null;

  return (
    <div className="wm-splash" role="presentation" onClick={() => setDone(true)}>
      <div className="wm-splash-glow" />
      <div className="wm-splash-stars" aria-hidden="true">
        {[...Array(7)].map((_, i) => (
          <i key={i} style={{ "--i": i }} />
        ))}
      </div>

      <div className="wm-splash-stage">
        <div className="wm-splash-logo">
          <span className="wm-splash-ring" />
          <LogoMark size={104} animated />
        </div>

        <div className="wm-splash-text">
          <div className="wm-splash-greet">
            <span className="wm-greet-small">مع تحيات</span>
            <span className="wm-greet-name">مستر سعيد محمود</span>
          </div>
          <div className="wm-splash-brand">
            <span className="wm-neon">وَمِيض</span>
            <span className="wm-neon-latin">WAMEED</span>
            <span className="wm-neon-bar" />
          </div>
        </div>
      </div>
    </div>
  );
}
