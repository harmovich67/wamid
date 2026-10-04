"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Thin progress bar at the top of the screen that starts the moment an internal link is clicked
 * and completes when the new route renders — instant feedback even on slow networks.
 */
export function NavProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(null); // null = hidden, 0..1
  const finishRef = useRef(null);
  const pathRef = useRef(pathname);

  useEffect(() => {
    let active = false;
    let trickle;
    let safety;

    function stopTimers() {
      clearInterval(trickle);
      clearTimeout(safety);
    }

    function start() {
      if (active) return;
      active = true;
      stopTimers();
      setProgress(0.08);
      trickle = setInterval(() => setProgress((p) => (p === null ? p : p + (0.9 - p) * 0.12)), 200);
      safety = setTimeout(finish, 12000);
    }

    function finish() {
      if (!active) return;
      active = false;
      stopTimers();
      setProgress(1);
      setTimeout(() => !active && setProgress(null), 260);
    }

    function onClick(e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest?.("a[href]");
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname.startsWith("/api/")) return;
      // Same page (only a hash/query change): nothing to wait for.
      if (url.pathname === pathRef.current) return;
      start();
    }

    function onPopState() {
      if (location.pathname !== pathRef.current) start();
    }

    finishRef.current = finish;
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      stopTimers();
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  useEffect(() => {
    pathRef.current = pathname;
    finishRef.current?.();
  }, [pathname]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]"
      style={{ opacity: progress === null || progress === 1 ? 0 : 1, transition: "opacity 250ms ease" }}
    >
      <div
        className="h-full origin-right bg-[linear-gradient(90deg,var(--amber),var(--primary))] shadow-[0_0_10px_var(--primary)]"
        style={{ transform: `scaleX(${progress ?? 0})`, transition: progress === null ? "none" : "transform 200ms ease-out" }}
      />
    </div>
  );
}
